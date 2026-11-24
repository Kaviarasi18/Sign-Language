from fastapi import APIRouter, HTTPException

from app.schemas.prediction import PredictRequest, PredictResponse
from app.services.isl_adapter import isl_adapter

router = APIRouter(prefix="/api", tags=["prediction"])


@router.post("/predict", response_model=PredictResponse)
def predict_isl_sequence(payload: PredictRequest):
    if not isl_adapter.model_loaded:
        raise HTTPException(
            status_code=503,
            detail=(
                f"ISL Keras model is not loaded ({isl_adapter.load_status}). "
                "Follow model/README.md to place audited model weights."
            ),
        )

    try:
        result = isl_adapter.predict_frames(payload.frames, threshold=payload.threshold)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference failure: {exc}") from exc


@router.post("/reset")
def reset_session():
    return {
        "reset": True,
        "message": "Recognition session cleared.",
    }
