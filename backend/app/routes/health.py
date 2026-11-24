from fastapi import APIRouter

from app.services.expression_mapping import EXPRESSION_MAPPING
from app.services.isl_adapter import isl_adapter

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def get_health():
    return {
        "status": "ok" if isl_adapter.model_loaded else "standby",
        "fastapiConnected": True,
        "modelLoaded": isl_adapter.model_loaded,
        "extractorReady": isl_adapter.extractor.is_ready,
        "mode": "keras-inference" if isl_adapter.model_loaded else "adapter-standby",
        "message": isl_adapter.load_status,
    }


@router.get("/model-info")
def get_model_info():
    return {
        "fastapiConnected": True,
        "modelLoaded": isl_adapter.model_loaded,
        "status": isl_adapter.load_status,
        "numClasses": len(EXPRESSION_MAPPING),
        "expectedInputShape": [None, 20, 156],
        "archiveAudit": isl_adapter.inspection_report,
        "supportedClasses": [EXPRESSION_MAPPING[k] for k in sorted(EXPRESSION_MAPPING.keys())],
    }
