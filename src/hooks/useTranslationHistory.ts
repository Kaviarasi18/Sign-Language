import { useCallback, useEffect, useState } from 'react';
import type { HistoryEntry, PredictionResult } from '../types/isl';

const STORAGE_KEY = 'signbridge_history_v1';
const MAX_ENTRIES = 200;

export function useTranslationHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore quota errors gracefully
    }
  }, [entries]);

  const addEntry = useCallback((result: PredictionResult) => {
    setEntries((prev) => {
      const latest = prev[0];
      // Avoid logging identical consecutive entries within 4 seconds
      if (
        latest &&
        latest.sign === result.sign &&
        latest.source === result.source &&
        Date.now() - new Date(latest.timestamp).getTime() < 4000
      ) {
        return prev;
      }
      const next: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sign: result.sign,
        englishText: result.englishText,
        confidence: result.confidence,
        source: result.source,
        timestamp: result.timestamp,
      };
      return [next, ...prev].slice(0, MAX_ENTRIES);
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setEntries([]);
  }, []);

  return {
    entries,
    addEntry,
    removeEntry,
    clearHistory,
  };
}
