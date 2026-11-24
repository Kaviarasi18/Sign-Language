import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  Cpu,
  Layers,
  ShieldAlert,
  Volume2,
} from 'lucide-react';
import type { NavSection } from '../types/isl';

interface LandingPageProps {
  onNavigate: (section: NavSection) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#1F0A18]">
      <div className="h-1 w-full prismatic-top-bar" />
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="border-b border-rose-100 bg-white/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-xl font-bold tracking-tight text-[#1F0A18] whitespace-nowrap shrink-0"
          >
            SignBridge
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#capabilities"
              className="hover:text-rose-600 transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#how-it-works"
              className="hover:text-violet-600 transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#model-audit"
              className="hover:text-teal-600 transition-colors whitespace-nowrap shrink-0"
            >
              Model Audit
            </a>
            <a
              href="#tech-stack"
              className="hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0"
            >
              Tech Stack
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('translator')}
              className="px-5 py-2.5 text-sm font-semibold text-white glitter-rose-btn rounded-lg transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 cursor-pointer"
            >
              Start Translating
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Prismatic Hero Split */}
        <section className="prismatic-hero-wash">
          <div className="max-w-7xl mx-auto px-6 pt-12 pb-16 lg:pt-20 lg:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold bg-gradient-to-r from-rose-600 via-fuchsia-600 to-violet-600 bg-clip-text text-transparent mb-4">
                    Indian Sign Language · Temporal Sequence AI · English Speech
                  </p>
                  <h1
                    className="font-display font-bold tracking-tight text-[#1F0A18] leading-[1.08] mb-6"
                    style={{ fontSize: 'clamp(2.25rem, 4vw, 3.75rem)', textWrap: 'balance' }}
                  >
                    Breaking Communication Barriers with AI.
                  </h1>
                  <p className="text-base lg:text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
                    SignBridge translates Indian Sign Language (ISL) gesture sequences captured
                    from your webcam into clear English text and spoken audio—built around the
                    pretrained INCLUDE dataset ISL recognition pipeline, verified ISL lookup, and
                    instant emergency phrasing.
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => onNavigate('translator')}
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-white glitter-rose-btn rounded-xl transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 cursor-pointer"
                    >
                      <span>Start Translating</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('overview')}
                      className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-white glitter-violet-btn rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Open Dashboard</span>
                    </button>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-rose-100 grid grid-cols-3 gap-6">
                  <div>
                    <div className="font-mono text-xl font-semibold text-rose-600 tabular-nums">
                      167
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Verified ISL classes</div>
                  </div>
                  <div>
                    <div className="font-mono text-xl font-semibold text-violet-600 tabular-nums">
                      20 × 156
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Temporal pose tensor</div>
                  </div>
                  <div>
                    <div className="font-mono text-xl font-semibold text-teal-600 tabular-nums">
                      44%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Reported test accuracy</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="h-full min-h-[320px] rounded-2xl overflow-hidden border border-rose-200 bg-rose-50 shadow-sm">
                  {!heroImgFailed ? (
                    <img
                      src="/src/assets/images/hero_signbridge_accessibility_1795519998917.jpg"
                      alt="Person performing an Indian Sign Language gesture in front of a laptop webcam"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-10 glitter-rose-surface text-white text-center">
                      <Camera className="w-10 h-10 text-rose-200 mb-3" />
                      <p className="font-display text-lg font-semibold">
                        Live Indian Sign Language Workspace
                      </p>
                      <p className="text-sm text-rose-100 mt-1 max-w-sm">
                        20-frame webcam gesture capture paired with pose/hand sequence modeling.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Accent Capabilities Bento */}
        <section id="capabilities" className="border-t border-slate-200 bg-slate-50/70 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <p className="text-sm font-semibold text-violet-600 mb-2">Core Platform Modules</p>
              <h2 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-[#1F0A18]">
                Built for Two-Way Accessible Communication
              </h2>
              <p className="text-slate-600 mt-3 leading-relaxed">
                Every module separates real model inference from fallback UI previews, never mixing
                American Sign Language into Indian Sign Language libraries.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-gradient-to-br from-white to-rose-50/60 border border-rose-200 rounded-2xl p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5">
                    <Camera className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#1F0A18]">
                    01. Live Temporal ISL Translator &amp; Speech Output
                  </h3>
                  <p className="text-slate-600 mt-2.5 leading-relaxed max-w-2xl">
                    Captures a synchronized 20-frame sequence window from your webcam—never single
                    isolated snapshots—and dispatches validated sequences to the FastAPI Keras
                    inference engine. Recognized words are displayed cleanly and spoken aloud via
                    natural English speech synthesis with frame-repeat suppression.
                  </p>
                </div>
                <div className="mt-6 pt-5 border-t border-rose-100 flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Permission on demand · Zero silent recording
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('translator')}
                    className="font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Launch Translator</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-violet-50/70 border border-violet-200 rounded-2xl p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mb-5">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#1F0A18]">
                    02. Natural Audio &amp; History
                  </h3>
                  <p className="text-slate-600 mt-2.5 leading-relaxed">
                    Controls for speech rate, English voice selection, instant replay, and a
                    timestamped local history separating model outputs from demo previews.
                  </p>
                </div>
                <div className="mt-6 pt-5 border-t border-violet-100">
                  <button
                    type="button"
                    onClick={() => onNavigate('history')}
                    className="text-sm font-semibold text-violet-700 hover:text-violet-800 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View History</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-teal-50/70 border border-teal-200 rounded-2xl p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-5">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-[#1F0A18]">
                    03. Verified Text to ISL Lookup
                  </h3>
                  <p className="text-slate-600 mt-2.5 leading-relaxed">
                    Tokenizes English phrases against the 167 verified INCLUDE ISL vocabulary
                    entries and official ISLRTC references, explicitly flagging unavailable terms.
                  </p>
                </div>
                <div className="mt-6 pt-5 border-t border-teal-100">
                  <button
                    type="button"
                    onClick={() => onNavigate('text-to-isl')}
                    className="text-sm font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Explore ISL Lexicon</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 glitter-emergency-surface text-white rounded-2xl p-8 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center mb-5">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-xl font-semibold">
                    04. High-Contrast Emergency Communication Board
                  </h3>
                  <p className="text-rose-50 mt-2.5 leading-relaxed max-w-2xl">
                    One-tap full-screen visual cards and loud speech synthesis for urgent phrases
                    like &ldquo;I NEED HELP&rdquo; and &ldquo;PLEASE CALL AN AMBULANCE&rdquo;.
                    Transparently documents which medical terms are outside the 167-class INCLUDE
                    recognition vocabulary.
                  </p>
                </div>
                <div className="mt-6 pt-5 border-t border-white/20 flex items-center justify-between text-sm">
                  <span className="text-rose-100">Instant visual &amp; spoken dispatch</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('emergency')}
                    className="font-semibold text-white hover:text-amber-100 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Emergency Board</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works & Model Inspection */}
        <section id="how-it-works" className="py-16 lg:py-24 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <p className="text-sm font-semibold text-teal-700 mb-2">Pipeline Architecture</p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#1F0A18]">
                How SignBridge Processes Video Sequences
              </h2>
              <p className="text-slate-600 mt-3 leading-relaxed">
                Inspection of the pretrained Hugging Face checkpoint confirmed that the classifier
                is a sequence model, not a single-frame image CNN.
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <span className="font-mono text-sm font-semibold text-rose-600 pt-0.5 tabular-nums">
                    01.
                  </span>
                  <div>
                    <h4 className="font-display font-semibold text-[#1F0A18]">
                      20-Frame Temporal Buffering
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      The browser collects a sliding 20-frame buffer after explicit webcam
                      permission, preventing noisy single-frame classification.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="font-mono text-sm font-semibold text-violet-600 pt-0.5 tabular-nums">
                    02.
                  </span>
                  <div>
                    <h4 className="font-display font-semibold text-[#1F0A18]">
                      156 Pose &amp; Hand Landmark Extraction
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Each frame yields 30 upper-body coordinates plus 63 left-hand and 63 right-hand
                      keypoint features, forming a{' '}
                      <code className="font-mono text-xs">(1, 20, 156)</code> tensor.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="font-mono text-sm font-semibold text-teal-600 pt-0.5 tabular-nums">
                    03.
                  </span>
                  <div>
                    <h4 className="font-display font-semibold text-[#1F0A18]">
                      Bidirectional LSTM &amp; Softmax Decoding
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Two stacked Bidirectional LSTM layers (32 units each) map sequences across
                      167 INCLUDE ISL classes with configurable confidence thresholding.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              id="model-audit"
              className="lg:col-span-7 bg-white border border-indigo-200 rounded-2xl p-8"
            >
              <div className="flex items-center justify-between gap-4 pb-5 border-b border-indigo-100">
                <div>
                  <h3 className="font-display text-lg font-semibold text-[#1F0A18]">
                    Pretrained Model Inspection Findings
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    cdsteameight/ISL-SignLanguageTranslation · isl-translate-v1.keras
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Full Audit Report
                </button>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 mt-6 text-sm">
                <div>
                  <dt className="text-slate-500">Dataset Origin</dt>
                  <dd className="font-medium text-[#1F0A18] mt-1">
                    INCLUDE ISL Video Dataset (Zenodo 4010759)
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Checkpoint Format &amp; Size</dt>
                  <dd className="font-mono text-xs font-medium text-rose-700 mt-1 tabular-nums">
                    Keras 3.2.1 (.keras) · 252.6 MB
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Expected Input Tensor</dt>
                  <dd className="font-mono text-xs font-medium text-violet-700 mt-1 tabular-nums">
                    (batch, 20, 156) · float32
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Reported Evaluation Accuracy</dt>
                  <dd className="font-mono text-xs font-medium text-teal-700 mt-1 tabular-nums">
                    44% test accuracy · 46.23% val (26 epochs)
                  </dd>
                </div>
              </dl>

              <div className="mt-6 pt-5 border-t border-indigo-100 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 leading-relaxed">
                  <strong className="text-[#1F0A18]">Safe Deserialization Policy:</strong>{' '}
                  Inspection revealed that <code className="font-mono text-xs">isl-translate-v1.keras</code>{' '}
                  references a custom wrapper class (<code className="font-mono text-xs">ISLSignPosTranslator</code>)
                  wrapping PyTorch OpenPose pose/hand estimators. SignBridge enforces{' '}
                  <code className="font-mono text-xs">safe_mode=True</code> and isolates inference
                  through an explicit Python FastAPI adapter.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section id="tech-stack" className="border-t border-slate-200 bg-slate-50/70 py-14">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <p className="text-sm font-semibold text-indigo-600 mb-1">System Architecture</p>
                <h2 className="font-display text-2xl font-bold text-[#1F0A18]">
                  Decoupled Frontend &amp; Python ML Stack
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Integration Checklist</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: Layers,
                  title: 'Frontend Interface',
                  detail: 'React 19 · TypeScript · Tailwind CSS · WebRTC Camera & Web Speech API',
                  border: 'border-rose-200',
                  iconBg: 'bg-rose-50 text-rose-600',
                },
                {
                  icon: Cpu,
                  title: 'API Gateway',
                  detail: 'Express proxy validating 20-frame sequences with FastAPI fallback detection',
                  border: 'border-violet-200',
                  iconBg: 'bg-violet-50 text-violet-600',
                },
                {
                  icon: Camera,
                  title: 'ML Inference Backend',
                  detail: 'Python · FastAPI · Keras 3 / PyTorch / OpenCV / NumPy',
                  border: 'border-sky-200',
                  iconBg: 'bg-sky-50 text-sky-600',
                },
                {
                  icon: BookOpen,
                  title: 'Verified ISL Corpus',
                  detail: '167 INCLUDE ISL classes · ISLRTC Dictionary · Zenodo 4010759',
                  border: 'border-teal-200',
                  iconBg: 'bg-teal-50 text-teal-600',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={`bg-white border ${item.border} rounded-2xl p-6`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center mb-3`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-display font-semibold text-[#1F0A18] text-base">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{item.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p className="font-display font-semibold text-[#1F0A18]">SignBridge</p>
          <p>
            Indian Sign Language Translator · Powered by the INCLUDE ISL Dataset &amp; Keras
            Sequence Model
          </p>
          <button
            type="button"
            onClick={() => onNavigate('translator')}
            className="text-rose-600 font-medium hover:underline cursor-pointer"
          >
            Open Live Translator
          </button>
        </div>
      </footer>
    </div>
  );
}
