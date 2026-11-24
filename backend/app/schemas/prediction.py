from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class PredictRequest(BaseModel):
    frames: List[str] = Field(
        ...,
        min_length=20,
        max_length=20,
        description="Exact 20-frame temporal sequence as base64 image data URLs.",
    )
    threshold: float = Field(default=0.35, ge=0.0, le=1.0)
    session_id: Optional[str] = Field(default=None, max_length=64)

    @field_validator("frames")
    @classmethod
    def validate_frames_non_empty(cls, v: List[str]) -> List[str]:
        if len(v) != 20:
            raise ValueError("Model requires an exact temporal sequence of 20 frames.")
        return v


class TopCandidate(BaseModel):
    class_id: int
    label: str
    confidence: float


class PredictResponse(BaseModel):
    sign: str
    english_text: str
    class_id: int
    confidence: float
    below_threshold: bool
    sequence_frames_used: int
    top_candidates: List[TopCandidate]
    source: str = "model"
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    fastapiConnected: bool = True
    modelLoaded: bool
    extractorReady: bool
    mode: str
    message: str
