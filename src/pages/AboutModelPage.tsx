import { CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';
import catalog from '../data/isl_verified_catalog.json';
import type { ModelInfoResponse, TrainingEpoch } from '../types/isl';

interface AboutModelPageProps {
  modelInfo: ModelInfoResponse | null;
}

const TRAINING_HISTORY = catalog.trainingHistory as TrainingEpoch[];

export function AboutModelPage({ modelInfo }: AboutModelPageProps) {
  const inspection = modelInfo?.inspection;

  // Build SVG polyline points for genuine 26-epoch training/validation accuracy
  const chartW = 560;
  const chartH = 180;
  const padX = 36;
  const padY = 16;
  const plotW = chartW - padX * 2;
  const plotH = chartH - padY * 2;

  const toPoint = (epochIdx: number, val: number) => {
    const x = padX + (epochIdx / Math.max(1, TRAINING_HISTORY.length - 1)) * plotW;
    const y = padY + (1 - Math.min(1, Math.max(0, val))) * plotH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const trainPoints = TRAINING_HISTORY.map((e, idx) => toPoint(idx, e.accuracy)).join(' ');
  const valPoints = TRAINING_HISTORY.map((e, idx) => toPoint(idx, e.valAccuracy)).join(' ');

  return (
    <div className="space-y-6">
      {/* Architecture & Security Overview */}
      <section className="bg-white border border-rose-100 rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-rose-100">
          <div>
            <h2 className="font-display text-xl font-bold text-[#2A0A14]">
              Pretrained ISL Model Inspection &amp; Security Audit
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Direct structural inspection of{' '}
              <code className="font-mono text-xs">
                cdsteameight/ISL-SignLanguageTranslation/isl-translate-v1.keras
              </code>
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <a
              href="https://huggingface.co/cdsteameight/ISL-SignLanguageTranslation"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:underline"
            >
              <span>Hugging Face Repo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-rose-200" aria-hidden="true">
              ·
            </span>
            <a
              href="https://zenodo.org/records/4010759"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:underline"
            >
              <span>Zenodo INCLUDE Dataset</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          <div className="space-y-4 text-sm">
            <h3 className="font-display font-semibold text-[#2A0A14]">
              Inspected Tensor &amp; Architecture Contract
            </h3>
            <dl className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200">
                <dt className="text-slate-500">Keras Save Version</dt>
                <dd className="font-mono font-semibold text-rose-900 mt-1">
                  {inspection?.kerasVersion ?? '3.2.1'} ({inspection?.fileSizeHuman ?? '252.6 MB'})
                </dd>
              </div>
              <div className="p-3.5 rounded-lg bg-violet-50/70 border border-violet-200">
                <dt className="text-slate-500">Input Tensor Shape</dt>
                <dd className="font-mono font-semibold text-violet-900 mt-1 tabular-nums">
                  (None, 20, 156)
                </dd>
              </div>
              <div className="p-3.5 rounded-lg bg-sky-50/70 border border-sky-200">
                <dt className="text-slate-500">Output Classes</dt>
                <dd className="font-mono font-semibold text-sky-900 mt-1 tabular-nums">
                  167 ISL Expressions
                </dd>
              </div>
              <div className="p-3.5 rounded-lg bg-teal-50/70 border border-teal-200">
                <dt className="text-slate-500">Reported Test Accuracy</dt>
                <dd className="font-mono font-semibold text-teal-900 mt-1 tabular-nums">
                  44.0% (Val 46.23% @ Epoch 26)
                </dd>
              </div>
            </dl>

            <div>
              <h4 className="text-xs font-semibold text-[#1F0A18] mb-2">
                156-Feature Frame Vector Breakdown
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li>
                  • <strong>Body Pose (30):</strong> 15 x-coordinates + 15 y-coordinates from
                  OpenPose body25
                </li>
                <li>
                  • <strong>Left Hand (63):</strong> 21 x + 21 y + 21 peak markers
                </li>
                <li>
                  • <strong>Right Hand (63):</strong> 21 x + 21 y + 21 peak markers
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/60 flex items-start gap-2.5 text-xs text-slate-700">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#1F0A18]">
                  Safe Deserialization Check (safe_mode=True)
                </p>
                <p className="mt-1 leading-relaxed">
                  ZIP archive inspection of <code className="font-mono">isl-translate-v1.keras</code>{' '}
                  showed root class <code className="font-mono">ISLSignPosTranslator</code> in{' '}
                  <code className="font-mono">src.ISL_Model_parameter</code>, which bundles two
                  PyTorch <code className="font-mono">TorchModuleWrapper</code> pose/hand models
                  with the Sequential Bidirectional LSTM head. SignBridge never passes{' '}
                  <code className="font-mono">safe_mode=False</code>; the FastAPI adapter inspects{' '}
                  <code className="font-mono">config.json</code> first and isolates custom class
                  loading.
                </p>
              </div>
            </div>
          </div>

          {/* Genuine 26-Epoch Training Curve */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-sm text-[#1F0A18]">
                Training Log Metrics (26 Epochs · csv.log)
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5 text-rose-600 font-medium">
                  <span className="w-3 h-0.5 bg-rose-600 inline-block" />
                  Train Acc
                </span>
                <span className="inline-flex items-center gap-1.5 text-violet-700 font-medium">
                  <span className="w-3 h-0.5 bg-violet-600 inline-block" />
                  Val Acc
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40 p-4">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full h-auto"
                role="img"
                aria-label="Training and validation accuracy across 26 epochs"
              >
                {[0.2, 0.4, 0.6, 0.8].map((tick) => {
                  const y = padY + (1 - tick) * plotH;
                  return (
                    <g key={tick}>
                      <line
                        x1={padX}
                        y1={y}
                        x2={chartW - padX}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={6}
                        y={y + 4}
                        fontSize="10"
                        fill="#475569"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {Math.round(tick * 100)}%
                      </text>
                    </g>
                  );
                })}
                <polyline
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="2.5"
                  points={trainPoints}
                />
                <polyline
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="2.5"
                  points={valPoints}
                />
              </svg>
              <div className="flex justify-between text-xs font-mono text-slate-500 mt-2 px-2 tabular-nums">
                <span>Epoch 1 (Val 12.6%)</span>
                <span>Epoch 13 (Val 42.2%)</span>
                <span>Epoch 26 (Val 46.2%)</span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-semibold text-[#1F0A18] mb-2">
                Sequential Classifier Layers
              </h4>
              <ol className="text-xs font-mono text-slate-600 space-y-1 bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                {(inspection?.classifierArchitecture ?? []).map((layer, idx) => (
                  <li key={idx}>
                    {idx + 1}. {layer}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Checklist */}
      <section className="bg-white border border-violet-100 rounded-2xl p-6 lg:p-8">
        <h3 className="font-display text-lg font-semibold text-[#1F0A18]">
          Python FastAPI Integration Checklist
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Follow these steps to run the Python TensorFlow/Keras + OpenCV FastAPI inference server
          alongside the React frontend on your laptop:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
          <div className="space-y-3 text-sm text-slate-700">
            {[
              'Install Python dependencies from backend/requirements.txt in a Python 3.10–3.11 virtual environment.',
              'Download isl-translate-v1.keras (and companion isl_model_final.keras weights) into model/weights/ via huggingface-cli.',
              'Start FastAPI on port 8000: uvicorn app.main:app --host 0.0.0.0 --port 8000 (from backend/).',
              'Set FASTAPI_BACKEND_URL=http://127.0.0.1:8000 in the root environment so the Express /api proxy connects automatically.',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-1" />
                <span>{step}</span>
              </div>
            ))}
          </div>

          <pre className="rounded-xl glitter-rose-surface text-rose-50 p-4 text-xs font-mono overflow-x-auto leading-relaxed">
{`# 1. Setup & start Python FastAPI ML Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2. Verify backend & model inspection
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/model-info`}
          </pre>
        </div>
      </section>
    </div>
  );
}
