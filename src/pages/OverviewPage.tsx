import {
  ArrowRight,
  BookOpen,
  Camera,
  History,
  ShieldAlert,
  Volume2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { HealthStatus, HistoryEntry, ModelInfoResponse, NavSection } from '../types/isl';

interface OverviewPageProps {
  onNavigate: (section: NavSection) => void;
  health: HealthStatus | null;
  modelInfo: ModelInfoResponse | null;
  historyCount: number;
  recentHistory: HistoryEntry[];
}

export function OverviewPage({
  onNavigate,
  health,
  historyCount,
  recentHistory,
}: OverviewPageProps) {
  const backendReady = Boolean(health?.fastapiConnected && health?.modelLoaded);

  return (
    <div className="space-y-8">
      {/* Clean, Focused Hero Workspace Card */}
      <section className="rounded-2xl border border-rose-200/70 glitter-rose-tint p-7 sm:p-9 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[#1F0A18]">
              {backendReady ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span>{backendReady ? 'FastAPI Connected' : 'FastAPI Standby'}</span>
            </span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="text-violet-700 font-medium tabular-nums">
              {historyCount} saved translations
            </span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1F0A18]">
            Indian Sign Language Workspace
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
            Translate live ISL gestures into English text and spoken audio, look up verified ISL
            signs, or open quick emergency phrases.
          </p>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('translator')}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl glitter-rose-btn text-white text-sm font-semibold transition-all whitespace-nowrap cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Start Live Translation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Distinct Multi-Accent 3-Card Core Modules Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button
          type="button"
          onClick={() => onNavigate('translator')}
          className="text-left bg-gradient-to-br from-white to-rose-50/70 border border-rose-200 hover:border-rose-400 rounded-2xl p-6 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-semibold text-[#1F0A18]">
              Live Translator
            </h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Capture webcam sign sequences and convert them into English text and speech.
            </p>
          </div>
          <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
            <span>Open Translator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('text-to-isl')}
          className="text-left bg-gradient-to-br from-white to-teal-50/70 border border-teal-200 hover:border-teal-400 rounded-2xl p-6 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-semibold text-[#1F0A18]">
              Text to ISL Lookup
            </h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Check English words against 167 verified ISL signs and ISLRTC references.
            </p>
          </div>
          <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700">
            <span>Browse Vocabulary</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('emergency')}
          className="text-left bg-gradient-to-br from-white to-orange-50/70 border border-orange-200 hover:border-orange-400 rounded-2xl p-6 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-display text-base font-semibold text-[#1F0A18]">
              Emergency Board
            </h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Display high-contrast urgent phrases fullscreen with instant spoken alerts.
            </p>
          </div>
          <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700">
            <span>Open Emergency Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </section>

      {/* Clean Recent Translations List */}
      <section className="bg-white border border-indigo-100 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-indigo-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="font-display text-base font-semibold text-[#1F0A18]">
              Recent Translations
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            View All
          </button>
        </div>

        {recentHistory.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-600">
              No translations recorded yet. Start a session in Live Translator to see recent
              phrases here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-2">
            {recentHistory.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="py-3 flex items-center justify-between gap-4 text-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Volume2 className="w-4 h-4 text-violet-500 shrink-0" />
                  <span className="font-semibold text-[#1F0A18] truncate">
                    {entry.englishText}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500 tabular-nums shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
