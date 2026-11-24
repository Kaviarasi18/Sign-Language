import catalog from '../data/isl_verified_catalog.json';
import type { IslClassEntry, PredictionResult } from '../types/isl';

const DEMO_SIGN_POOL = [
  'Hello',
  'How are you',
  'I',
  'Friend',
  'Hospital',
  'School',
  'Good',
  'Morning',
  'Water',
  'Today',
];

const verifiedClasses = catalog.classes as IslClassEntry[];
const demoEntries = verifiedClasses.filter((entry) =>
  DEMO_SIGN_POOL.some((label) => label.toLowerCase() === entry.label.toLowerCase())
);

/**
 * Isolated DEMO MODE adapter for UI, speech synthesis, and history workflow testing
 * when the Python FastAPI Keras backend is disconnected.
 * Outputs are strictly tagged source: "demo" and never presented as real AI inference.
 */
export function runDemoSequenceSimulation(stepIndex: number): PredictionResult {
  const pool = demoEntries.length > 0 ? demoEntries : verifiedClasses.slice(0, 8);
  const selected = pool[stepIndex % pool.length];

  return {
    sign: selected.label,
    englishText: selected.label,
    classId: selected.id,
    confidence: null,
    belowThreshold: false,
    sequenceFramesUsed: 20,
    topCandidates: [],
    source: 'demo',
    timestamp: new Date().toISOString(),
    note: 'DEMO MODE preview output for UI & Text-to-Speech testing. Connect Python FastAPI backend for real Keras inference.',
  };
}
