import base64
import re
from typing import List
import cv2
import numpy as np

DATA_URL_PATTERN = re.compile(r"^data:image/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$")
MAX_IMAGE_BYTES = 350_000


def decode_frame_data_url(data_url: str) -> np.ndarray:
    """Safely decode a validated base64 image data URL into an RGB OpenCV array."""
    match = DATA_URL_PATTERN.match(data_url)
    if not match:
        raise ValueError("Invalid frame format; expected base64 JPEG/PNG/WebP data URL.")

    raw_b64 = match.group(2)
    raw_bytes = base64.b64decode(raw_b64, validate=True)
    if len(raw_bytes) > MAX_IMAGE_BYTES:
        raise ValueError("Frame exceeds maximum allowed byte size.")

    arr = np.frombuffer(raw_bytes, dtype=np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("OpenCV failed to decode image frame.")

    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)


class PoseHandFeatureExtractor:
    """
    Extracts the 156-dimensional keypoint vector per frame expected by the
    pretrained ISL Bidirectional LSTM classifier:
      - 30 body features: 15 body x-coords + 15 body y-coords
      - 63 left-hand features: 21 x + 21 y + 21 peak flags
      - 63 right-hand features: 21 x + 21 y + 21 peak flags
    """

    def __init__(self) -> None:
        self._ready = False
        self._pose = None
        self._hands = None
        try:
            import mediapipe as mp

            self._pose = mp.solutions.pose.Pose(
                static_image_mode=False,
                model_complexity=1,
                min_detection_confidence=0.4,
            )
            self._hands = mp.solutions.hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                min_detection_confidence=0.4,
            )
            self._ready = True
        except Exception:
            self._ready = False

    @property
    def is_ready(self) -> bool:
        return self._ready

    def extract_frame_features(self, rgb_frame: np.ndarray) -> np.ndarray:
        if not self._ready or self._pose is None or self._hands is None:
            raise RuntimeError(
                "MediaPipe pose/hand extractor is not initialized. Install mediapipe."
            )

        h, w, _ = rgb_frame.shape
        body_x = np.zeros(15, dtype=np.float32)
        body_y = np.zeros(15, dtype=np.float32)

        pose_res = self._pose.process(rgb_frame)
        if pose_res.pose_landmarks:
            # Map upper-body and primary body landmarks (first 15 OpenPose-aligned joints)
            mp_indices = [0, 12, 14, 16, 11, 13, 15, 24, 26, 28, 23, 25, 27, 2, 5]
            for out_idx, mp_idx in enumerate(mp_indices):
                lm = pose_res.pose_landmarks.landmark[mp_idx]
                if lm.visibility > 0.25:
                    body_x[out_idx] = lm.x * w
                    body_y[out_idx] = lm.y * h

        hand0_x = np.zeros(21, dtype=np.float32)
        hand0_y = np.zeros(21, dtype=np.float32)
        hand0_t = np.zeros(21, dtype=np.float32)
        hand1_x = np.zeros(21, dtype=np.float32)
        hand1_y = np.zeros(21, dtype=np.float32)
        hand1_t = np.zeros(21, dtype=np.float32)

        hands_res = self._hands.process(rgb_frame)
        if hands_res.multi_hand_landmarks and hands_res.multi_handedness:
            for landmarks, handedness in zip(
                hands_res.multi_hand_landmarks, hands_res.multi_handedness
            ):
                label = handedness.classification[0].label.lower()
                xs = np.array([lm.x * w for lm in landmarks.landmark], dtype=np.float32)
                ys = np.array([lm.y * h for lm in landmarks.landmark], dtype=np.float32)
                ts = np.ones(21, dtype=np.float32)
                if label == "left":
                    hand0_x, hand0_y, hand0_t = xs, ys, ts
                else:
                    hand1_x, hand1_y, hand1_t = xs, ys, ts

        return np.concatenate(
            [body_x, body_y, hand0_x, hand0_y, hand0_t, hand1_x, hand1_y, hand1_t],
            axis=0,
        ).astype(np.float32)

    def extract_sequence(self, frames: List[str]) -> np.ndarray:
        if len(frames) != 20:
            raise ValueError(f"Expected 20 frames, received {len(frames)}.")

        seq = [self.extract_frame_features(decode_frame_data_url(f)) for f in frames]
        return np.expand_dims(np.stack(seq, axis=0), axis=0)  # Shape: (1, 20, 156)
