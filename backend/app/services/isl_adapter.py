import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import numpy as np

from app.services.expression_mapping import EXPRESSION_MAPPING
from app.services.model_inspector import inspect_keras_archive
from app.utils.preprocessing import PoseHandFeatureExtractor


class ISLModelAdapter:
    """
    Isolated integration adapter for cdsteameight/ISL-SignLanguageTranslation.
    Enforces safe_mode=True deserialization checks and never bypasses security warnings.
    """

    def __init__(self) -> None:
        self.model_path = Path(
            os.getenv("ISL_MODEL_PATH", "../model/weights/isl-translate-v1.keras")
        ).resolve()
        self.classifier_path = Path(
            os.getenv(
                "ISL_CLASSIFIER_WEIGHTS_PATH", "../model/weights/isl_model_final.keras"
            )
        ).resolve()
        self.model = None
        self.model_loaded = False
        self.load_status = "not_initialized"
        self.inspection_report: Dict[str, Any] = {}
        self.extractor = PoseHandFeatureExtractor()

    def _build_verified_lstm_classifier(self):
        import keras
        from keras.layers import (
            Activation,
            BatchNormalization,
            Bidirectional,
            Dense,
            Dropout,
            Input,
            LSTM,
            Masking,
        )
        from keras.models import Sequential

        seq_model = Sequential(
            [
                Input(shape=(20, 156)),
                Masking(mask_value=0.0),
                BatchNormalization(),
                Bidirectional(LSTM(32, recurrent_dropout=0.2, return_sequences=True)),
                Dropout(0.2),
                Bidirectional(LSTM(32, recurrent_dropout=0.2)),
                Activation("elu"),
                Dense(32, use_bias=False, kernel_initializer="he_normal"),
                BatchNormalization(),
                Dropout(0.2),
                Activation("elu"),
                Dense(32, use_bias=False, kernel_initializer="he_normal"),
                BatchNormalization(),
                Activation("elu"),
                Dropout(0.2),
                Dense(len(EXPRESSION_MAPPING), activation="softmax"),
            ]
        )
        return seq_model

    def load(self) -> None:
        os.environ.setdefault("KERAS_BACKEND", "torch")
        self.inspection_report = inspect_keras_archive(self.model_path)

        # Priority 1: If standard safe Sequential classifier archive exists, load with safe_mode=True
        if self.classifier_path.exists():
            clf_audit = inspect_keras_archive(self.classifier_path)
            if clf_audit.get("has_lambda_layers"):
                self.load_status = "blocked_lambda_layer_detected"
                self.model_loaded = False
                return

            try:
                model = self._build_verified_lstm_classifier()
                model.load_weights(str(self.classifier_path))
                self.model = model
                self.model_loaded = True
                self.load_status = "loaded_verified_lstm_classifier"
                return
            except Exception as exc:
                self.load_status = f"classifier_load_failed: {exc}"
                self.model_loaded = False
                return

        # Priority 2: Inspect isl-translate-v1.keras strictly without disabling safe_mode
        if not self.inspection_report.get("exists"):
            self.load_status = "model_file_missing"
            self.model_loaded = False
            return

        if self.inspection_report.get("has_lambda_layers"):
            self.load_status = "blocked_lambda_layer_detected"
            self.model_loaded = False
            return

        if self.inspection_report.get("requires_custom_objects"):
            self.load_status = (
                "custom_class_requires_explicit_registration: "
                f"{self.inspection_report.get('class_name')} "
                "(provide companion isl_model_final.keras weights or audited custom class)"
            )
            self.model_loaded = False
            return

        try:
            import keras

            self.model = keras.models.load_model(str(self.model_path), safe_mode=True)
            self.model_loaded = True
            self.load_status = "loaded_safe_mode"
        except Exception as exc:
            self.load_status = f"safe_load_failed: {exc}"
            self.model_loaded = False

    def predict_frames(self, frames: List[str], threshold: float = 0.35) -> Dict[str, Any]:
        if not self.model_loaded or self.model is None:
            raise RuntimeError(
                f"ISL model is not loaded ({self.load_status}). "
                "See model/README.md to complete model weight integration."
            )

        if not self.extractor.is_ready:
            raise RuntimeError(
                "Pose/hand feature extractor (MediaPipe) is unavailable in this environment."
            )

        tensor = self.extractor.extract_sequence(frames)  # (1, 20, 156)
        probs = self.model.predict(tensor, verbose=0)[0]
        probs = np.asarray(probs, dtype=np.float32)

        top_indices = np.argsort(probs)[-3:][::-1]
        best_idx = int(top_indices[0])
        best_conf = float(probs[best_idx])
        best_label = EXPRESSION_MAPPING.get(best_idx, f"Class_{best_idx}")

        return {
            "sign": best_label,
            "english_text": best_label,
            "class_id": best_idx,
            "confidence": round(best_conf, 4),
            "below_threshold": best_conf < threshold,
            "sequence_frames_used": len(frames),
            "top_candidates": [
                {
                    "class_id": int(idx),
                    "label": EXPRESSION_MAPPING.get(int(idx), f"Class_{int(idx)}"),
                    "confidence": round(float(probs[int(idx)]), 4),
                }
                for idx in top_indices
            ],
            "source": "model",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


isl_adapter = ISLModelAdapter()
