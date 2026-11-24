import json
import zipfile
from pathlib import Path
from typing import Any, Dict


def inspect_keras_archive(model_path: Path) -> Dict[str, Any]:
    """
    Safely inspects a Keras 3 .keras ZIP archive WITHOUT executing deserialization
    or disabling safe_mode checks. Detects Lambda layers and custom class objects.
    """
    if not model_path.exists():
        return {
            "exists": False,
            "safe_to_load_directly": False,
            "reason": f"Model file not found at {model_path}",
        }

    if not zipfile.is_zipfile(model_path):
        return {
            "exists": True,
            "safe_to_load_directly": False,
            "reason": "File is not a valid Keras 3 ZIP archive.",
        }

    with zipfile.ZipFile(model_path, "r") as zf:
        names = zf.namelist()
        metadata = {}
        config = {}

        if "metadata.json" in names:
            metadata = json.loads(zf.read("metadata.json").decode("utf-8"))
        if "config.json" in names:
            config = json.loads(zf.read("config.json").decode("utf-8"))

    class_name = config.get("class_name", "")
    module_name = config.get("module", "")
    raw_config_str = json.dumps(config)
    has_lambda = '"class_name": "Lambda"' in raw_config_str

    requires_custom_objects = class_name not in {"Sequential", "Functional"}

    return {
        "exists": True,
        "files": names,
        "metadata": metadata,
        "class_name": class_name,
        "module": module_name,
        "has_lambda_layers": has_lambda,
        "requires_custom_objects": requires_custom_objects,
        "safe_to_load_directly": (not has_lambda) and (not requires_custom_objects),
        "reason": (
            f"Archive defines custom class '{class_name}' from '{module_name}'. "
            "Keras safe_mode=True requires explicit custom object registration or "
            "reconstructing the audited Sequential LSTM classifier and loading weights."
            if requires_custom_objects
            else "Standard Keras graph without Lambda layers."
        ),
    }
