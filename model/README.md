# Pretrained ISL Model Inspection & Integration Guide

## 1. Inspected Repository

- **Hugging Face Model:** `https://huggingface.co/cdsteameight/ISL-SignLanguageTranslation`
- **File:** `isl-translate-v1.keras` (252,597,825 bytes / ~252.6 MB)
- **Training Dataset:** INCLUDE Indian Sign Language Video Dataset (`https://zenodo.org/records/4010759`)
- **Reported Evaluation:** `44%` testing accuracy (`runs/run_2024_04_30-18_46_12/csv.log`: 26 epochs, final `val_accuracy = 0.4623`)

## 2. Architecture & Input Contract

Inspection of `isl-translate-v1.keras` (`metadata.json` & `config.json`) and the accompanying pipeline confirms:

- **Not a single-image classifier.** It operates on **20-frame temporal sequences** of **156 pose & hand landmark features** per frame: `(batch, 20, 156)`.
  - **30 Body Keypoints:** 15 x-coordinates + 15 y-coordinates (`OpenPose body25`)
  - **63 Left-Hand Keypoints:** 21 x + 21 y + 21 peak flags
  - **63 Right-Hand Keypoints:** 21 x + 21 y + 21 peak flags
- **Sequence Classifier Head:**
  1. `Input(shape=(20, 156))`
  2. `Masking(mask_value=0.0)`
  3. `BatchNormalization()`
  4. `Bidirectional(LSTM(32, recurrent_dropout=0.2, return_sequences=True))`
  5. `Dropout(0.2)`
  6. `Bidirectional(LSTM(32, recurrent_dropout=0.2))`
  7. `Activation("elu")`
  8. `Dense(32, use_bias=False) -> BatchNormalization -> Dropout(0.2) -> Activation("elu")`
  9. `Dense(32, use_bias=False) -> BatchNormalization -> Activation("elu") -> Dropout(0.2)`
  10. `Dense(167, activation="softmax")`
- **Verified Classes:** 167 ISL expressions (`0..166`), mapped in `backend/app/services/expression_mapping.py`.

## 3. Security Check Findings (`safe_mode=True`)

Inside `isl-translate-v1.keras`, `config.json` contains:
```json
{
  "module": "src.ISL_Model_parameter",
  "class_name": "ISLSignPosTranslator",
  "config": {"trainable": true, "dtype": "float32"},
  "registered_name": "ISLSignPosTranslator"
}
```
Because `ISLSignPosTranslator` is a custom unregistered class wrapping PyTorch `TorchModuleWrapper` layers (`bodypose_25_model` and `handpose_model`), Keras 3 with `safe_mode=True` blocks loading `isl-translate-v1.keras` unless the class is explicitly audited and registered.

**Never pass `safe_mode=False` to force deserialization.**

Instead, download the audited weights into `model/weights/`:

```bash
mkdir -p model/weights
huggingface-cli download cdsteameight/ISL-SignLanguageTranslation isl-translate-v1.keras --local-dir model/weights
huggingface-cli download sunilsarolkar/isl-translation-model isl_model_final.keras --local-dir model/weights
```

The FastAPI adapter (`backend/app/services/isl_adapter.py`) inspects the `.keras` ZIP `config.json` first and reconstructs the verified Sequential Bidirectional LSTM classifier before loading weights safely.
