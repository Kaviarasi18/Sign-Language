import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  FlipHorizontal2,
  Play,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  WifiOff,
} from 'lucide-react';
import { predictSequence, resetBackendSession } from '../services/api';
import { runDemoSequenceSimulation } from '../services/demoAdapter';
import type {
  CameraStatus,
  HealthStatus,
  PredictionResult,
  RecognitionStatus,
} from '../types/isl';

interface LiveTranslatorPageProps {
  health: HealthStatus | null;
  demoMode: boolean;
  onSetDemoMode: (enabled: boolean) => void;
  speech: {
    isSupported: boolean;
    isSpeaking: boolean;
    voices: SpeechSynthesisVoice[];
    options: {
      enabled: boolean;
      rate: number;
      selectedVoiceURI: string;
    };
    setOptions: React.Dispatch<
      React.SetStateAction<{
        enabled: boolean;
        rate: number;
        selectedVoiceURI: string;
      }>
    >;
    speak: (text: string, force?: boolean) => void;
    stop: () => void;
    resetCooldown: () => void;
  };
  onRecordHistory: (result: PredictionResult) => void;
}

const SEQUENCE_LENGTH = 20;
const CAPTURE_INTERVAL_MS = 100; // 10 fps -> 2.0s temporal window of 20 frames

export function LiveTranslatorPage({
  health,
  demoMode,
  onSetDemoMode,
  speech,
  onRecordHistory,
}: LiveTranslatorPageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameBufferRef = useRef<string[]>([]);
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef<boolean>(false);
  const demoStepRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(`sess-${Date.now()}`);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [recognitionStatus, setRecognitionStatus] = useState<RecognitionStatus>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [bufferCount, setBufferCount] = useState<number>(0);
  const [mirrored, setMirrored] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(0.35);

  const [latestResult, setLatestResult] = useState<PredictionResult | null>(null);
  const [sessionWords, setSessionWords] = useState<PredictionResult[]>([]);

  const backendReady = Boolean(health?.fastapiConnected && health?.modelLoaded);

  const stopStreamOnly = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    inFlightRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      stopStreamOnly();
    };
  }, [stopStreamOnly]);

  const handleStopRecognition = useCallback(() => {
    stopStreamOnly();
    setCameraStatus('idle');
    setRecognitionStatus('paused');
    setBufferCount(0);
    frameBufferRef.current = [];
  }, [stopStreamOnly]);

  const handleReset = useCallback(async () => {
    frameBufferRef.current = [];
    setBufferCount(0);
    setLatestResult(null);
    setSessionWords([]);
    setBackendError(null);
    demoStepRef.current = 0;
    sessionIdRef.current = `sess-${Date.now()}`;
    speech.stop();
    speech.resetCooldown();
    try {
      await resetBackendSession();
    } catch {
      // Safe no-op if backend offline
    }
    if (cameraStatus === 'active') {
      setRecognitionStatus('buffering');
    } else {
      setRecognitionStatus('idle');
    }
  }, [cameraStatus, speech]);

  const processWindow = useCallback(
    async (frames: string[]) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setRecognitionStatus('inferring');

      try {
        if (demoMode && !backendReady) {
          const simulated = runDemoSequenceSimulation(demoStepRef.current++);
          setLatestResult(simulated);
          setBackendError(null);
          setSessionWords((prev) => [simulated, ...prev].slice(0, 12));
          onRecordHistory(simulated);
          speech.speak(simulated.englishText, false);
          setRecognitionStatus('active');
          return;
        }

        const result = await predictSequence(frames, threshold, sessionIdRef.current);
        setLatestResult(result);
        setBackendError(null);
        setRecognitionStatus('active');

        if (!result.belowThreshold) {
          setSessionWords((prev) => [result, ...prev].slice(0, 12));
          onRecordHistory(result);
          speech.speak(result.englishText, false);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Prediction request failed.';
        setBackendError(message);
        setRecognitionStatus('backend-offline');
      } finally {
        inFlightRef.current = false;
      }
    },
    [backendReady, demoMode, onRecordHistory, speech, threshold]
  );

  const startCaptureLoop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }

    frameBufferRef.current = [];
    setBufferCount(0);
    setRecognitionStatus('buffering');

    let framesSinceLastPredict = 0;

    timerRef.current = window.setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 320;
      canvas.height = 240;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.72);

      const nextBuf = [...frameBufferRef.current, dataUrl];
      if (nextBuf.length > SEQUENCE_LENGTH) {
        nextBuf.shift();
      }
      frameBufferRef.current = nextBuf;
      setBufferCount(nextBuf.length);

      if (nextBuf.length === SEQUENCE_LENGTH) {
        framesSinceLastPredict += 1;
        // Run sequence inference every 10 frames (1.0s stride over 20-frame sliding window)
        if (framesSinceLastPredict >= 10 || !inFlightRef.current && latestResult === null) {
          framesSinceLastPredict = 0;
          void processWindow([...nextBuf]);
        }
      }
    }, CAPTURE_INTERVAL_MS);
  }, [latestResult, processWindow]);

  const handleStartRecognition = async () => {
    setCameraError(null);
    setBackendError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('unavailable');
      setCameraError(
        'Webcam access is unavailable in this browser context. Ensure you are using HTTPS or localhost.'
      );
      return;
    }

    setCameraStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraStatus('active');
      startCaptureLoop();
    } catch (err) {
      const domErr = err as DOMException;
      if (domErr?.name === 'NotAllowedError' || domErr?.name === 'PermissionDeniedError') {
        setCameraStatus('permission-denied');
        setCameraError(
          'Camera permission was denied. Allow webcam access in your browser site settings and click Start Recognition again.'
        );
      } else if (domErr?.name === 'NotFoundError' || domErr?.name === 'DevicesNotFoundError') {
        setCameraStatus('unavailable');
        setCameraError('No webcam device was detected on this system.');
      } else {
        setCameraStatus('error');
        setCameraError(domErr?.message || 'Unable to start webcam stream.');
      }
      setRecognitionStatus('idle');
    }
  };

  const cameraStatusLabel: Record<CameraStatus, string> = {
    idle: 'Camera Standby',
    requesting: 'Requesting Permission',
    active: 'Camera Active',
    'permission-denied': 'Permission Denied',
    unavailable: 'No Camera Device',
    error: 'Camera Error',
  };

  const recognitionStatusLabel: Record<RecognitionStatus, string> = {
    idle: 'Waiting to Start',
    buffering: `Buffering Sequence (${bufferCount}/${SEQUENCE_LENGTH})`,
    inferring: 'Analyzing 20-Frame Sequence',
    active: demoMode && !backendReady ? 'DEMO MODE Active' : 'Recognition Active',
    paused: 'Recognition Stopped',
    'backend-offline': 'FastAPI Backend Offline',
    error: 'Recognition Error',
  };

  const isRunning = cameraStatus === 'active';

  return (
    <div className="space-y-6">
      {/* Mode / Backend Notice Banner */}
      {!backendReady && (
        <div
          className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            demoMode
              ? 'bg-rose-50 border-rose-300 text-[#2A0A14]'
              : 'bg-white border-rose-100 text-[#2A0A14]'
          }`}
        >
          <div className="flex items-start gap-3">
            {demoMode ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <WifiOff className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <p className="font-semibold">
                {demoMode
                  ? 'DEMO MODE Enabled — Simulated UI & Speech Testing Only'
                  : 'Python FastAPI ML Backend Not Connected'}
              </p>
              <p className="text-xs mt-1 text-slate-600">
                {demoMode
                  ? 'Predictions shown in DEMO MODE cycle through verified INCLUDE class names for UI, speech, and history testing. They are NOT real webcam AI recognition.'
                  : 'Start the FastAPI backend (backend/app/main.py) for real Keras LSTM inference on 20-frame webcam sequences, or enable DEMO MODE to test the interface and speech synthesis.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSetDemoMode(!demoMode)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-all ${
              demoMode
                ? 'bg-[#2A0A14] text-white hover:bg-[#4C0519]'
                : 'glitter-rose-btn text-white'
            }`}
          >
            {demoMode ? 'Disable Demo Mode' : 'Enable Demo Mode'}
          </button>
        </div>
      )}

      {/* Two-Column Translator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: Webcam Preview & Capture Controls */}
        <section className="lg:col-span-7 bg-white border border-rose-100 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            {/* Status Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-rose-100">
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  {cameraStatus === 'active' ? (
                    <Camera className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <CameraOff className="w-4 h-4 text-rose-300" />
                  )}
                  <span>{cameraStatusLabel[cameraStatus]}</span>
                </span>
                <span className="text-rose-200" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      recognitionStatus === 'active'
                        ? 'text-rose-600'
                        : recognitionStatus === 'backend-offline'
                          ? 'text-amber-600'
                          : 'text-rose-300'
                    }`}
                  />
                  <span className="tabular-nums">{recognitionStatusLabel[recognitionStatus]}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMirrored((m) => !m)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#4c1d95] bg-[#1e1b4b] hover:bg-[#312e81] text-xs font-medium text-white cursor-pointer transition-colors"
              >
                <FlipHorizontal2 className="w-3.5 h-3.5 text-pink-300" />
                <span>{mirrored ? 'Mirrored' : 'Normal View'}</span>
              </button>
            </div>

            {/* Video Viewport */}
            <div className="relative mt-4 aspect-video w-full rounded-xl overflow-hidden glitter-rose-surface border border-rose-200 flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${mirrored ? '-scale-x-100' : ''} ${
                  isRunning ? 'block' : 'hidden'
                }`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {!isRunning && (
                <div className="p-8 text-center text-rose-50 max-w-md">
                  <Camera className="w-10 h-10 text-rose-200 mx-auto mb-3" />
                  <p className="font-display text-base font-semibold">
                    Webcam Access Requested on Demand
                  </p>
                  <p className="text-xs text-rose-100/85 mt-1.5 leading-relaxed">
                    Click <strong>Start Recognition</strong> below to grant webcam permission and
                    begin capturing 20-frame Indian Sign Language sequences. Video frames are never
                    stored on disk.
                  </p>
                </div>
              )}

              {isRunning && (
                <div className="absolute bottom-3 left-3 right-3 bg-[#1F0A18]/85 backdrop-blur-sm text-white px-3.5 py-2.5 rounded-lg flex items-center justify-between gap-4 text-xs">
                  <span className="font-medium">
                    Temporal Window:{' '}
                    <span className="font-mono tabular-nums">
                      {bufferCount}/{SEQUENCE_LENGTH}
                    </span>{' '}
                    frames
                  </span>
                  <div className="w-32 sm:w-44 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-400 via-fuchsia-400 to-teal-300 transition-all duration-100"
                      style={{ width: `${(bufferCount / SEQUENCE_LENGTH) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Banners */}
            {cameraError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Camera Error</p>
                  <p className="mt-0.5">{cameraError}</p>
                </div>
              </div>
            )}

            {backendError && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <WifiOff className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Inference Backend Unavailable</p>
                    <p className="mt-0.5">{backendError}</p>
                  </div>
                </div>
                {!demoMode && (
                  <button
                    type="button"
                    onClick={() => onSetDemoMode(true)}
                    className="px-3 py-1.5 rounded-md bg-amber-900 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Use Demo Mode
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Controls & Threshold */}
          <div className="mt-6 pt-5 border-t border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {!isRunning ? (
                <button
                  type="button"
                  onClick={handleStartRecognition}
                  disabled={cameraStatus === 'requesting'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glitter-rose-btn disabled:opacity-50 text-white text-sm font-semibold transition-all whitespace-nowrap cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>
                    {cameraStatus === 'requesting' ? 'Requesting Camera...' : 'Start Recognition'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopRecognition}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2A0A14] hover:bg-[#4C0519] text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop Recognition</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-[#18181b] hover:bg-[#27272a] text-white text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-rose-300" />
                <span>Reset Translation</span>
              </button>
            </div>

            <label className="flex items-center gap-3 text-xs text-slate-600">
              <span className="whitespace-nowrap">
                Threshold: <strong className="font-mono tabular-nums text-[#2A0A14]">{Math.round(threshold * 100)}%</strong>
              </span>
              <input
                type="range"
                min={0.15}
                max={0.85}
                step={0.05}
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-24 accent-rose-600 cursor-pointer"
              />
            </label>
          </div>
        </section>

        {/* RIGHT COLUMN: Recognized Sign, Confidence, Speech & Recent Words */}
        <section className="lg:col-span-5 bg-white border border-rose-100 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-rose-100">
              <h2 className="font-display text-base font-semibold text-[#2A0A14]">
                Recognised ISL Translation
              </h2>
              {latestResult && (
                <span className="text-xs font-mono text-rose-600 tabular-nums">
                  {latestResult.source === 'demo' ? 'DEMO MODE' : `Class #${latestResult.classId}`}
                </span>
              )}
            </div>

            {/* Translation Output Box */}
            <div className="mt-5">
              {!latestResult ? (
                <div className="rounded-xl bg-[#FFF7F9] border border-rose-100 p-8 text-center">
                  <p className="text-sm font-medium text-[#2A0A14]">
                    No gesture sequence decoded yet
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Start recognition and sign clearly in front of the camera. Predictions appear
                    once a full 20-frame temporal window is captured.
                  </p>
                </div>
              ) : (
                <div
                  className={`rounded-xl border p-6 ${
                    latestResult.source === 'demo'
                      ? 'bg-rose-50/70 border-rose-200'
                      : 'bg-[#FFF7F9] border-rose-200'
                  }`}
                >
                  {latestResult.source === 'demo' && (
                    <div className="text-xs font-semibold text-rose-700 mb-2">
                      DEMO MODE PREVIEW · NOT REAL AI RECOGNITION
                    </div>
                  )}

                  {latestResult.belowThreshold ? (
                    <div>
                      <div className="text-sm font-semibold text-[#2A0A14]">
                        Uncertain Gesture (Below Threshold)
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Top candidate &ldquo;{latestResult.sign}&rdquo; scored{' '}
                        {latestResult.confidence !== null
                          ? `${(latestResult.confidence * 100).toFixed(1)}%`
                          : 'below threshold'}
                        .
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs text-rose-700/80">Recognised English Phrase</div>
                      <div className="font-display text-3xl font-bold text-[#2A0A14] mt-1">
                        {latestResult.englishText}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span>
                          Confidence:{' '}
                          <strong className="font-mono text-[#2A0A14] tabular-nums">
                            {latestResult.confidence !== null
                              ? `${(latestResult.confidence * 100).toFixed(1)}%`
                              : 'Unavailable in Demo Mode'}
                          </strong>
                        </span>
                        <span className="text-rose-200" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono tabular-nums">
                          {latestResult.sequenceFramesUsed} frames
                        </span>
                      </div>
                    </div>
                  )}

                  {latestResult.topCandidates.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-rose-200/70 space-y-2">
                      <div className="text-xs font-medium text-rose-700/80">Top Model Candidates</div>
                      {latestResult.topCandidates.slice(0, 3).map((cand) => (
                        <div
                          key={cand.classId}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-[#2A0A14] font-medium">{cand.label}</span>
                          <span className="font-mono text-rose-700 tabular-nums">
                            {(cand.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Text-to-Speech Module B Controls */}
            <div className="mt-6 pt-5 border-t border-violet-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-[#1F0A18]">
                  Spoken English Audio
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    speech.setOptions((prev) => ({ ...prev, enabled: !prev.enabled }))
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 hover:text-violet-800 cursor-pointer"
                >
                  {speech.options.enabled ? (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Auto-Speak Enabled</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-500">Auto-Speak Muted</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={!latestResult || !speech.isSupported}
                  onClick={() => latestResult && speech.speak(latestResult.englishText, true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glitter-violet-btn disabled:opacity-40 text-white text-sm font-semibold transition-all cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{speech.isSpeaking ? 'Speaking...' : 'Replay Speech'}</span>
                </button>

                {speech.isSpeaking && (
                  <button
                    type="button"
                    onClick={speech.stop}
                    className="px-3.5 py-2.5 rounded-xl border border-[#4c0519] bg-[#2A0A14] hover:bg-[#4C0519] text-xs font-medium text-white cursor-pointer"
                  >
                    Stop
                  </button>
                )}
              </div>

              {speech.isSupported ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="block">
                    <span className="text-slate-500 block mb-1">English Voice</span>
                    <select
                      value={speech.options.selectedVoiceURI}
                      onChange={(e) =>
                        speech.setOptions((prev) => ({
                          ...prev,
                          selectedVoiceURI: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs text-[#1F0A18]"
                    >
                      {speech.voices.length === 0 && <option value="">Default Browser Voice</option>}
                      {speech.voices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-slate-500 block mb-1">
                      Speech Rate (<span className="font-mono tabular-nums">{speech.options.rate.toFixed(2)}x</span>)
                    </span>
                    <input
                      type="range"
                      min={0.7}
                      max={1.3}
                      step={0.05}
                      value={speech.options.rate}
                      onChange={(e) =>
                        speech.setOptions((prev) => ({
                          ...prev,
                          rate: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full mt-1.5 accent-violet-600 cursor-pointer"
                    />
                  </label>
                </div>
              ) : (
                <p className="text-xs text-rose-700">
                  Browser Speech Synthesis API is not supported in this browser.
                </p>
              )}
            </div>
          </div>

          {/* Recent Recognized Words */}
          <div className="pt-5 border-t border-rose-100">
            <h3 className="font-display text-sm font-semibold text-[#2A0A14] mb-3">
              Recent Session Words
            </h3>
            {sessionWords.length === 0 ? (
              <p className="text-xs text-slate-500">
                Recognized phrases in this session will appear here with quick audio replay.
              </p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {sessionWords.map((item, idx) => (
                  <div
                    key={`${item.timestamp}-${idx}`}
                    className="flex items-center justify-between gap-2 py-2 border-b border-rose-50 last:border-b-0 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-[#2A0A14]">{item.englishText}</span>
                      <span className="text-rose-300 mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-slate-500">
                        {item.source === 'demo' ? 'Demo' : 'Model'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => speech.speak(item.englishText, true)}
                      aria-label={`Speak ${item.englishText}`}
                      className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
