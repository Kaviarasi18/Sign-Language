import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const RAW_FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || 'http://127.0.0.1:8000';

function sanitizeBackendUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'http://127.0.0.1:8000';
    }
    return parsed.origin;
  } catch {
    return 'http://127.0.0.1:8000';
  }
}

const FASTAPI_URL = sanitizeBackendUrl(RAW_FASTAPI_URL);

const catalogPath = path.resolve(__dirname, 'src/data/isl_verified_catalog.json');
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf-8')) as {
  classes: Array<{
    id: number;
    label: string;
    category: string;
    f1: number | null;
    precision: number | null;
    recall: number | null;
    support: number | null;
    sampleVideo: string | null;
    sampleFrames: number | null;
  }>;
  trainingHistory: Array<{
    epoch: number;
    accuracy: number;
    loss: number;
    valAccuracy: number;
    valLoss: number;
  }>;
};

const VERIFIED_MODEL_INSPECTION = {
  modelId: 'cdsteameight/ISL-SignLanguageTranslation',
  modelFile: 'isl-translate-v1.keras',
  companionClassifierRepo: 'sunilsarolkar/isl-translation-model',
  companionClassifierFile: 'isl_model_final.keras',
  datasetSource: 'https://zenodo.org/records/4010759',
  datasetName: 'INCLUDE (Indian Sign Language Video Dataset)',
  fileSizeBytes: 252597825,
  fileSizeHuman: '252.6 MB',
  kerasVersion: '3.2.1',
  dateSaved: '2024-05-01@11:31:17',
  reportedTestAccuracy: 0.44,
  finalValAccuracy: catalogData.trainingHistory[catalogData.trainingHistory.length - 1]?.valAccuracy ?? 0.4623,
  totalEpochsLogged: catalogData.trainingHistory.length,
  sequenceLength: 20,
  featuresPerFrame: 156,
  expectedInputShape: [null, 20, 156],
  featureBreakdown: {
    bodyKeypoints: '30 features (15 x-coordinates + 15 y-coordinates from OpenPose body25)',
    leftHandKeypoints: '63 features (21 x + 21 y + 21 peak markers)',
    rightHandKeypoints: '63 features (21 x + 21 y + 21 peak markers)',
  },
  classifierArchitecture: [
    'Input(shape=(20, 156))',
    'Masking(mask_value=0.0)',
    'BatchNormalization()',
    'Bidirectional(LSTM(32, recurrent_dropout=0.2, return_sequences=True))',
    'Dropout(0.2)',
    'Bidirectional(LSTM(32, recurrent_dropout=0.2))',
    'Activation("elu")',
    'Dense(32, use_bias=False) -> BatchNormalization -> Dropout(0.2) -> Activation("elu")',
    'Dense(32, use_bias=False) -> BatchNormalization -> Activation("elu") -> Dropout(0.2)',
    'Dense(167, activation="softmax")',
  ],
  securityAudit: {
    safeModeRequired: true,
    safeDeserializationBypassed: false,
    rootConfigClass: 'ISLSignPosTranslator',
    rootConfigModule: 'src.ISL_Model_parameter',
    lambdaLayersDetected: false,
    notes:
      'isl-translate-v1.keras serializes a custom wrapper class (ISLSignPosTranslator) combining PyTorch TorchModuleWrapper pose/hand models with the 20x156 Bidirectional-LSTM head. Standard Keras safe_mode=True blocks loading without explicitly registering the audited class and PyTorch backend.',
  },
  numClasses: catalogData.classes.length,
  supportedClasses: catalogData.classes.map((c) => c.label),
};

const DATA_URL_RE = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_FRAME_CHARS = 350_000;

async function fetchFastApi(endpoint: string, init?: RequestInit, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${FASTAPI_URL}${endpoint}`, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', async (_req, res) => {
    try {
      const upstream = await fetchFastApi('/api/health', { method: 'GET' }, 1800);
      if (upstream.ok) {
        const data = await upstream.json();
        return res.json({
          ...data,
          proxyServer: 'online',
          fastapiConnected: true,
        });
      }
      return res.json({
        status: 'standby',
        proxyServer: 'online',
        fastapiConnected: false,
        modelLoaded: false,
        mode: 'adapter-standby',
        message:
          'Python FastAPI ML backend is not active on ' +
          FASTAPI_URL +
          '. Start backend/app/main.py or enable DEMO MODE for UI testing.',
      });
    } catch {
      return res.json({
        status: 'standby',
        proxyServer: 'online',
        fastapiConnected: false,
        modelLoaded: false,
        mode: 'adapter-standby',
        message:
          'Python FastAPI ML backend is not connected on ' +
          FASTAPI_URL +
          '. Frontend is operating with the verified model inspection adapter.',
      });
    }
  });

  app.get('/api/model-info', async (_req, res) => {
    try {
      const upstream = await fetchFastApi('/api/model-info', { method: 'GET' }, 2000);
      if (upstream.ok) {
        const data = await upstream.json();
        return res.json({
          ...data,
          fastapiConnected: true,
          inspection: VERIFIED_MODEL_INSPECTION,
        });
      }
    } catch {
      // Fall back cleanly to static verified inspection report when FastAPI is offline
    }

    return res.json({
      fastapiConnected: false,
      modelLoaded: false,
      status: 'not_loaded_fastapi_offline',
      inspection: VERIFIED_MODEL_INSPECTION,
    });
  });

  app.post('/api/predict', async (req, res) => {
    const body = req.body as {
      frames?: unknown;
      threshold?: unknown;
      sessionId?: unknown;
    };

    if (!Array.isArray(body?.frames)) {
      return res.status(400).json({
        error: 'Request must include a "frames" array of 20 sequential video frames.',
        code: 'INVALID_FRAMES_ARRAY',
      });
    }

    if (body.frames.length !== VERIFIED_MODEL_INSPECTION.sequenceLength) {
      return res.status(400).json({
        error: `Model requires an exact temporal sequence of ${VERIFIED_MODEL_INSPECTION.sequenceLength} frames; received ${body.frames.length}.`,
        code: 'INVALID_SEQUENCE_LENGTH',
      });
    }

    for (let i = 0; i < body.frames.length; i++) {
      const frame = body.frames[i];
      if (
        typeof frame !== 'string' ||
        frame.length > MAX_FRAME_CHARS ||
        !DATA_URL_RE.test(frame)
      ) {
        return res.status(400).json({
          error: `Frame at index ${i} failed validation (must be base64 JPEG/PNG/WebP data URL under 350 KB).`,
          code: 'INVALID_FRAME_FORMAT',
        });
      }
    }

    let threshold = 0.35;
    if (typeof body.threshold === 'number' && Number.isFinite(body.threshold)) {
      if (body.threshold < 0 || body.threshold > 1) {
        return res.status(400).json({
          error: 'Confidence threshold must be between 0.0 and 1.0.',
          code: 'INVALID_THRESHOLD',
        });
      }
      threshold = body.threshold;
    }

    try {
      const upstream = await fetchFastApi(
        '/api/predict',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frames: body.frames,
            threshold,
            session_id: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : undefined,
          }),
        },
        15000
      );

      const payload = await upstream.json();
      return res.status(upstream.status).json(payload);
    } catch {
      return res.status(503).json({
        error:
          'Python FastAPI inference server is not reachable. Start the FastAPI backend (backend/app/main.py) or enable DEMO MODE explicitly for UI testing.',
        code: 'BACKEND_UNAVAILABLE',
      });
    }
  });

  app.post('/api/reset', async (_req, res) => {
    try {
      const upstream = await fetchFastApi('/api/reset', { method: 'POST' }, 2000);
      if (upstream.ok) {
        const data = await upstream.json();
        return res.json({ ...data, fastapiConnected: true });
      }
    } catch {
      // Clean reset even when FastAPI is offline
    }
    return res.json({
      reset: true,
      fastapiConnected: false,
      message: 'Client temporal sequence buffer reset.',
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SignBridge server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
