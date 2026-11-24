import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Search,
  Volume2,
} from 'lucide-react';
import catalog from '../data/isl_verified_catalog.json';
import type { IslClassEntry } from '../types/isl';

interface TextToIslPageProps {
  onSpeak: (text: string, force?: boolean) => void;
}

const VERIFIED_CLASSES = catalog.classes as IslClassEntry[];
const CATEGORIES = [
  'All',
  ...Array.from(new Set(VERIFIED_CLASSES.map((c) => c.category))).sort(),
];

interface TokenMatch {
  query: string;
  matched: IslClassEntry | null;
}

function tokenizeToVerifiedIsl(input: string): TokenMatch[] {
  const cleaned = input.trim().replace(/[?!.,;:]+/g, ' ');
  if (!cleaned) return [];

  const lowerWords = cleaned.toLowerCase().split(/\s+/).filter(Boolean);
  const results: TokenMatch[] = [];

  // Sort multi-word ISL classes longest-first so phrases like "How are you" or "Train Station" match intact
  const sortedClasses = [...VERIFIED_CLASSES].sort(
    (a, b) => b.label.split(/\s+/).length - a.label.split(/\s+/).length
  );

  let i = 0;
  while (i < lowerWords.length) {
    let matchedEntry: IslClassEntry | null = null;
    let consumed = 1;

    for (const entry of sortedClasses) {
      const entryTokens = entry.label
        .toLowerCase()
        .replace(/[()]/g, '')
        .split(/\s+/)
        .filter(Boolean);

      if (entryTokens.length === 0) continue;
      if (i + entryTokens.length <= lowerWords.length) {
        const slice = lowerWords.slice(i, i + entryTokens.length).join(' ');
        if (slice === entryTokens.join(' ')) {
          matchedEntry = entry;
          consumed = entryTokens.length;
          break;
        }
      }
    }

    // Also handle slash/synonym labels like "big large", "small little", "Street or Road", "Store or Shop"
    if (!matchedEntry) {
      const single = lowerWords[i];
      matchedEntry =
        VERIFIED_CLASSES.find((entry) => {
          const aliases = entry.label
            .toLowerCase()
            .replace(/[()]/g, '')
            .split(/\s+or\s+|\s+/)
            .filter(Boolean);
          return aliases.includes(single);
        }) ?? null;
    }

    results.push({
      query: lowerWords.slice(i, i + consumed).join(' '),
      matched: matchedEntry,
    });
    i += consumed;
  }

  return results;
}

export function TextToIslPage({ onSpeak }: TextToIslPageProps) {
  const [inputText, setInputText] = useState('Hello Friend Good Morning');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lexiconSearch, setLexiconSearch] = useState('');

  const tokenMatches = useMemo(() => tokenizeToVerifiedIsl(inputText), [inputText]);

  const filteredLexicon = useMemo(() => {
    return VERIFIED_CLASSES.filter((item) => {
      const catOk = selectedCategory === 'All' || item.category === selectedCategory;
      const q = lexiconSearch.trim().toLowerCase();
      const searchOk =
        !q ||
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        String(item.id) === q;
      return catOk && searchOk;
    });
  }, [lexiconSearch, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Reverse Lookup Input Card */}
      <section className="bg-white border border-teal-100 rounded-2xl p-6 lg:p-8">
        <div className="max-w-3xl">
          <h2 className="font-display text-xl font-bold text-[#1F0A18]">
            English Text to Verified Indian Sign Language (ISL) Lookup
          </h2>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Enter English words or phrases to look up verified ISL sign entries from the{' '}
            <strong>INCLUDE dataset (167 classes)</strong> and official{' '}
            <strong>ISLRTC Dictionary</strong> references. Words without a verified ISL entry are
            explicitly flagged as unavailable—SignBridge never substitutes ASL signs or invents
            gestures.
          </p>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type English text (e.g., Hello How are you Hospital)"
            className="flex-1 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm text-[#1F0A18] focus:border-teal-600 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => inputText.trim() && onSpeak(inputText, true)}
            disabled={!inputText.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl glitter-teal-btn disabled:opacity-40 text-white text-sm font-semibold whitespace-nowrap cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Speak Phrase</span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Quick examples:</span>
          {[
            'Hello How are you',
            'I need Hospital Medicine',
            'Good Morning Friend School',
            'Train Station India',
          ].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setInputText(preset)}
              className="px-3 py-1 rounded-md bg-[#042f2e] hover:bg-[#0f4c45] text-white font-medium transition-colors cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Token-by-Token Verification Results */}
        <div className="mt-6 pt-6 border-t border-teal-100">
          {tokenMatches.length === 0 ? (
            <p className="text-sm text-slate-500">
              Enter English text above to check verified ISL coverage word by word.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokenMatches.map((tok, index) => {
                if (!tok.matched) {
                  return (
                    <div
                      key={`${tok.query}-${index}`}
                      className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-xs font-medium text-amber-800">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Verified ISL Sign Unavailable</span>
                        </div>
                        <div className="font-display text-lg font-semibold text-[#1F0A18] mt-2">
                          &ldquo;{tok.query}&rdquo;
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          Not included in the 167-class INCLUDE model vocabulary. Search the
                          official Government of India ISLRTC dictionary to confirm the authentic
                          ISL sign.
                        </p>
                      </div>
                      <a
                        href="https://divyangjan.depwd.gov.in/islrtc/"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:underline"
                      >
                        <span>Search Official ISLRTC Dictionary</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );
                }

                const m = tok.matched;
                return (
                  <div
                    key={`${tok.query}-${index}`}
                    className="rounded-xl border border-teal-200 bg-gradient-to-br from-white to-teal-50/40 p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Verified ISL Entry</span>
                        </span>
                        <span className="font-mono text-teal-700 tabular-nums">
                          ID #{m.id}
                        </span>
                      </div>

                      <div className="font-display text-xl font-bold text-[#1F0A18] mt-2">
                        {m.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {m.category}
                        {m.sampleVideo ? ` · Clip ${m.sampleVideo} (${m.sampleFrames} frames)` : ''}
                      </div>

                      {m.f1 !== null && (
                        <div className="mt-3 pt-3 border-t border-teal-100 grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                          <div>
                            <span className="text-slate-400 block">F1</span>
                            <span className="text-teal-800 font-semibold">
                              {(m.f1 * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Prec.</span>
                            <span className="text-sky-800 font-semibold">
                              {((m.precision ?? 0) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Recall</span>
                            <span className="text-violet-800 font-semibold">
                              {((m.recall ?? 0) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-teal-100 flex items-center justify-between gap-2 text-xs">
                      <a
                        href="https://zenodo.org/records/4010759"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline"
                      >
                        <span>INCLUDE Dataset</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://divyangjan.depwd.gov.in/islrtc/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-sky-700 hover:text-sky-900"
                      >
                        <span>ISLRTC Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Complete 167-Class Verified ISL Lexicon */}
      <section className="bg-white border border-teal-100 rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-teal-100">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#1F0A18]">
              Verified ISL Model Vocabulary ({filteredLexicon.length} of {VERIFIED_CLASSES.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact class labels extracted from cdsteameight/ISL-SignLanguageTranslation and
              sunilsarolkar/isl-test-data
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-teal-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={lexiconSearch}
              onChange={(e) => setLexiconSearch(e.target.value)}
              placeholder="Filter signs or class ID..."
              className="w-full rounded-lg border border-teal-200 pl-9 pr-3 py-2 text-xs text-[#1F0A18] focus:border-teal-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 mt-4 p-1.5 bg-slate-100 rounded-lg">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#042f2e] text-white shadow-xs'
                  : 'bg-[#1e293b] text-slate-100 hover:bg-[#0f172a]'
              }`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Compact Data Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-rose-100 text-xs text-slate-500">
                <th className="py-2.5 pr-4 font-medium">ID</th>
                <th className="py-2.5 pr-4 font-medium">ISL Sign Label</th>
                <th className="py-2.5 pr-4 font-medium">Category</th>
                <th className="py-2.5 pr-4 font-medium text-right">Test F1</th>
                <th className="py-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {filteredLexicon.slice(0, 60).map((entry) => (
                <tr key={entry.id} className="hover:bg-rose-50/50">
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-500 tabular-nums">
                    {entry.id}
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-[#2A0A14]">{entry.label}</td>
                  <td className="py-2.5 pr-4 text-xs text-slate-600">
                    {entry.category.replace(/_/g, ' ')}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono text-xs text-slate-600 tabular-nums">
                    {entry.f1 !== null ? `${(entry.f1 * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setInputText(entry.label);
                        onSpeak(entry.label, true);
                      }}
                      className="px-2.5 py-1 rounded-md bg-[#2A0A14] hover:bg-[#580b2a] text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Inspect &amp; Speak
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLexicon.length > 60 && (
            <p className="text-xs text-slate-500 mt-3">
              Showing first 60 matching entries. Narrow your search or category filter to view
              specific signs.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
