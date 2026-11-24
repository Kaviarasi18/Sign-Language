# SignBridge – AI-Powered Indian Sign Language Translator

**Breaking Communication Barriers with AI.**

SignBridge is a full-stack accessibility application that translates Indian Sign Language (ISL) gesture sequences into English text and natural spoken audio, paired with verified ISL vocabulary lookup and rapid emergency communication.

## Architecture Overview

- **Frontend (`src/`):** React 19, TypeScript, Tailwind CSS, Lucide icons, WebRTC webcam sequence capture (`20` frames), and browser Speech Synthesis.
- **API Gateway (`server.ts`):** Express server on port `3000` serving the React app, validating `20`-frame sequences, and proxying `/api/*` requests to the Python FastAPI backend (`FASTAPI_BACKEND_URL`).
- **ML Inference Backend (`backend/`):** Python, FastAPI, Keras 3 (`KERAS_BACKEND=torch`), OpenCV, NumPy, and MediaPipe pose/hand landmark extraction feeding the `(1, 20, 156)` Bidirectional LSTM classifier.

## Pretrained Model Findings (`cdsteameight/ISL-SignLanguageTranslation`)

- **Model File:** `isl-translate-v1.keras` (~252.6 MB, Keras 3.2.1)
- **Dataset:** [INCLUDE ISL Video Dataset (Zenodo 4010759)](https://zenodo.org/records/4010759)
- **Input Format:** Temporal sequence `(batch, 20, 156)` (20 frames × 156 pose & hand landmarks—not single images)
- **Verified Classes:** 167 ISL expressions (`Adult` through `young`)
- **Reported Evaluation:** 44% testing accuracy (`46.23%` validation accuracy at Epoch 26)
- **Security Policy:** `safe_mode=True` is strictly enforced; `config.json` is audited before loading weights. See [`model/README.md`](model/README.md).

## Running Independently

### 1. Frontend & Express Gateway (Port 3000)

```bash
cp .env.example .env
npm install
npm run dev
```

### 2. Python FastAPI ML Backend (Port 8000)

```bash
cd backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Download verified model weights into ../model/weights/
mkdir -p ../model/weights
huggingface-cli download cdsteameight/ISL-SignLanguageTranslation isl-translate-v1.keras --local-dir ../model/weights
huggingface-cli download sunilsarolkar/isl-translation-model isl_model_final.keras --local-dir ../model/weights

uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /api/health` — Returns gateway, FastAPI connectivity, and model load status.
- `GET /api/model-info` — Returns inspected tensor dimensions, security audit, and 167 verified ISL classes.
- `POST /api/predict` — Validates an exact 20-frame base64 image sequence and returns recognized ISL sign, English text, and softmax confidence.
- `POST /api/reset` — Resets the active recognition session.

## Integration Checklist

- [x] Inspected `isl-translate-v1.keras` ZIP `config.json` & `metadata.json` without disabling `safe_mode`
- [x] Verified `(20, 156)` temporal input requirement and 167 INCLUDE class labels
- [x] Built demand-only webcam capture with 20-frame temporal buffering
- [x] Separated real FastAPI inference from explicit `DEMO MODE` UI testing
- [x] Added English Web Speech API synthesis with anti-repeat frame cooldown
- [x] Added verified Text-to-ISL lookup (flagging missing signs rather than substituting ASL)
- [x] Added high-contrast Emergency Communication board with honest vocabulary scope notice
