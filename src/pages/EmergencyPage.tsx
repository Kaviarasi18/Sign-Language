import { useState } from 'react';
import { Info, Maximize2, Minimize2, ShieldAlert, Volume2 } from 'lucide-react';

interface EmergencyPageProps {
  onSpeak: (text: string, force?: boolean) => void;
}

interface EmergencyPhrase {
  id: string;
  phrase: string;
  context: string;
}

const EMERGENCY_PHRASES: EmergencyPhrase[] = [
  {
    id: 'help',
    phrase: 'I NEED HELP',
    context: 'General urgent assistance',
  },
  {
    id: 'ambulance',
    phrase: 'PLEASE CALL AN AMBULANCE',
    context: 'Medical emergency dispatch (108 / 112 in India)',
  },
  {
    id: 'water',
    phrase: 'I NEED WATER',
    context: 'Immediate hydration or heat exhaustion support',
  },
  {
    id: 'danger',
    phrase: 'I AM IN DANGER',
    context: 'Personal safety threat alert',
  },
  {
    id: 'help-me',
    phrase: 'PLEASE HELP ME',
    context: 'Direct appeal to nearby responders',
  },
  {
    id: 'doctor',
    phrase: 'I NEED A DOCTOR',
    context: 'Immediate clinical attention',
  },
  {
    id: 'family',
    phrase: 'PLEASE CALL MY FAMILY',
    context: 'Emergency contact request',
  },
];

export function EmergencyPage({ onSpeak }: EmergencyPageProps) {
  const [activePhrase, setActivePhrase] = useState<EmergencyPhrase>(EMERGENCY_PHRASES[0]);
  const [billboardOpen, setBillboardOpen] = useState(false);

  const handleSelectPhrase = (item: EmergencyPhrase) => {
    setActivePhrase(item);
    onSpeak(item.phrase, true);
  };

  return (
    <div className="space-y-6">
      {/* Fullscreen High-Contrast Billboard Modal */}
      {billboardOpen && (
        <div className="fixed inset-0 z-50 glitter-emergency-surface text-white flex flex-col items-center justify-between p-6 sm:p-12">
          <div className="w-full max-w-4xl flex items-center justify-between">
            <span className="text-sm font-medium text-amber-100 inline-flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <span>Emergency Visual &amp; Audio Communication</span>
            </span>
            <button
              type="button"
              onClick={() => setBillboardOpen(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F0A18]/85 hover:bg-[#1F0A18] border border-white/25 text-white text-sm font-medium cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Exit Fullscreen</span>
            </button>
          </div>

          <div className="text-center max-w-4xl my-auto">
            <p className="text-sm text-amber-100 mb-4">{activePhrase.context}</p>
            <h2
              className="font-display font-extrabold tracking-tight text-white leading-tight"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5.25rem)' }}
            >
              {activePhrase.phrase}
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onSpeak(activePhrase.phrase, true)}
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl bg-[#1F0A18] hover:bg-[#380b26] border border-white/30 text-white text-base font-bold cursor-pointer shadow-lg"
            >
              <Volume2 className="w-5 h-5 text-rose-300" />
              <span>Speak Alert Again</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Phrase Display Card */}
      <section className="glitter-emergency-surface text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-100 mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Active Emergency Display</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            {activePhrase.phrase}
          </h2>
          <p className="text-sm text-rose-50 mt-1.5">{activePhrase.context}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onSpeak(activePhrase.phrase, true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1F0A18] hover:bg-[#380b26] border border-white/25 text-white text-sm font-semibold cursor-pointer shadow-md"
          >
            <Volume2 className="w-4 h-4 text-rose-300" />
            <span>Speak Now</span>
          </button>

          <button
            type="button"
            onClick={() => setBillboardOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1F0A18]/80 hover:bg-[#1F0A18] border border-white/25 text-white text-sm font-medium cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Fullscreen Display</span>
          </button>
        </div>
      </section>

      {/* Quick-Access Phrase Grid */}
      <section className="bg-white border border-rose-100 rounded-2xl p-6">
        <h3 className="font-display text-base font-semibold text-[#2A0A14] mb-1">
          Quick-Access Emergency Phrases
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Tap any phrase to display it prominently and immediately speak it aloud via English
          speech synthesis.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EMERGENCY_PHRASES.map((item) => {
            const isSelected = activePhrase.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPhrase(item)}
                className={`text-left rounded-xl border p-5 transition-colors cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-rose-100 bg-white hover:bg-rose-50/50'
                }`}
              >
                <div>
                  <div className="font-display text-lg font-bold text-[#2A0A14]">
                    {item.phrase}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{item.context}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between text-xs font-semibold text-rose-600">
                  <span>Tap to Display &amp; Speak</span>
                  <Volume2 className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Honest Model Vocabulary Coverage Notice */}
      <section className="bg-white border border-rose-100 rounded-2xl p-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-600 leading-relaxed">
          <h4 className="font-display font-semibold text-[#2A0A14]">
            Model Recognition Scope Notice
          </h4>
          <p className="mt-1">
            The pretrained <code className="font-mono text-xs">isl-translate-v1.keras</code> model
            recognizes <strong>167 specific INCLUDE words</strong>, which include{' '}
            <code className="font-mono text-xs">Hospital</code>,{' '}
            <code className="font-mono text-xs">Medicine</code>,{' '}
            <code className="font-mono text-xs">sick</code>,{' '}
            <code className="font-mono text-xs">Attack</code>, and{' '}
            <code className="font-mono text-xs">Death</code>. It is <strong>not</strong> trained
            to recognize full emergency sentences such as &ldquo;I NEED HELP&rdquo;,
            &ldquo;AMBULANCE&rdquo;, &ldquo;WATER&rdquo;, or &ldquo;DANGER&rdquo;—which is why
            this dedicated rapid-access communication board provides reliable immediate output.
          </p>
        </div>
      </section>
    </div>
  );
}
