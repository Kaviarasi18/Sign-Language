import { useMemo, useState } from 'react';
import { Download, Search, Trash2, Volume2 } from 'lucide-react';
import type { HistoryEntry } from '../types/isl';

interface HistoryPageProps {
  entries: HistoryEntry[];
  onSpeak: (text: string, force?: boolean) => void;
  onRemoveEntry: (id: string) => void;
  onClearHistory: () => void;
}

export function HistoryPage({
  entries,
  onSpeak,
  onRemoveEntry,
  onClearHistory,
}: HistoryPageProps) {
  const [filterSource, setFilterSource] = useState<'all' | 'model' | 'demo'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    return entries.filter((item) => {
      const sourceOk = filterSource === 'all' || item.source === filterSource;
      const q = searchQuery.trim().toLowerCase();
      const textOk =
        !q ||
        item.englishText.toLowerCase().includes(q) ||
        item.sign.toLowerCase().includes(q);
      return sourceOk && textOk;
    });
  }, [entries, filterSource, searchQuery]);

  const handleExportCsv = () => {
    const header = 'Timestamp,Sign,English Translation,Confidence,Source\n';
    const rows = filtered
      .map((r) => {
        const conf = r.confidence !== null ? (r.confidence * 100).toFixed(1) + '%' : 'N/A';
        const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
        return [esc(r.timestamp), esc(r.sign), esc(r.englishText), esc(conf), esc(r.source)].join(
          ','
        );
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `signbridge-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-sky-100 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-sky-100">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1F0A18]">
              Translation History ({filtered.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Stored locally in your browser. Real FastAPI model recognitions and DEMO MODE previews
              are tagged separately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#0e7490] bg-[#082f49] hover:bg-[#0c4a6e] disabled:opacity-40 text-xs font-medium text-white cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-300" />
              <span>Export CSV</span>
            </button>

            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                disabled={entries.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#881337] bg-[#4c0519] hover:bg-[#881337] disabled:opacity-40 text-xs font-semibold text-white cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                <span>Clear History</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearHistory();
                    setConfirmClear(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-[#881337] hover:bg-[#9f1239] text-white text-xs font-semibold cursor-pointer"
                >
                  Confirm Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-xs font-medium text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg self-start">
            {(
              [
                { id: 'all', label: 'All Entries' },
                { id: 'model', label: 'Real Model' },
                { id: 'demo', label: 'Demo Mode' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterSource(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  filterSource === tab.id
                    ? 'bg-[#1e1b4b] text-white shadow-xs'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-sky-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recognized signs..."
              className="w-full rounded-lg border border-sky-200 pl-9 pr-3 py-2 text-xs text-[#1F0A18] focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm font-medium text-[#1F0A18]">No translation records match</p>
            <p className="text-xs text-slate-500 mt-1">
              Recognized signs from the Live Translator are logged automatically with timestamps.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-sky-100 text-xs text-slate-500">
                  <th className="py-2.5 pr-4 font-medium">Recognised Sign / English</th>
                  <th className="py-2.5 pr-4 font-medium">Source</th>
                  <th className="py-2.5 pr-4 font-medium text-right">Confidence</th>
                  <th className="py-2.5 pr-4 font-medium">Date &amp; Time</th>
                  <th className="py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-sky-50/40">
                    <td className="py-3 pr-4 font-semibold text-[#1F0A18]">
                      {item.englishText}
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-600">
                      {item.source === 'demo' ? 'DEMO MODE Preview' : 'FastAPI Keras Model'}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono text-xs text-teal-700 tabular-nums">
                      {item.confidence !== null ? `${(item.confidence * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSpeak(item.englishText, true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[#1e1b4b] text-white hover:bg-[#312e81] cursor-pointer mr-1.5 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-violet-300" />
                        <span>Replay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveEntry(item.id)}
                        aria-label={`Remove ${item.englishText}`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
