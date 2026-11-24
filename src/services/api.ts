import type { HealthStatus, ModelInfoResponse, PredictionResult } from '../types/isl';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error(`Health check failed (HTTP ${res.status})`);
  }
  return (await res.json()) as HealthStatus;
}

export async function fetchModelInfo(): Promise<ModelInfoResponse> {
  const res = await fetch('/api/model-info');
  if (!res.ok) {
    throw new Error(`Model info request failed (HTTP ${res.status})`);
  }
  return (await res.json()) as ModelInfoResponse;
}

export async function predictSequence(
  frames: string[],
  threshold: number,
  sessionId: string
): Promise<PredictionResult> {
  const res = await fetch('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ frames, threshold, sessionId }),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error || `Prediction failed (HTTP ${res.status})`) as Error & {
      code?: string;
      status?: number;
    };
    err.code = data?.code;
    err.status = res.status;
    throw err;
  }

  return {
    sign: data.sign,
    englishText: data.english_text ?? data.englishText ?? data.sign,
    classId: data.class_id ?? data.classId ?? -1,
    confidence: typeof data.confidence === 'number' ? data.confidence : null,
    belowThreshold: Boolean(data.below_threshold ?? data.belowThreshold),
    sequenceFramesUsed: data.sequence_frames_used ?? data.sequenceFramesUsed ?? frames.length,
    topCandidates: Array.isArray(data.top_candidates ?? data.topCandidates)
      ? (data.top_candidates ?? data.topCandidates).map((c: Record<string, unknown>) => ({
          classId: Number(c.class_id ?? c.classId ?? -1),
          label: String(c.label ?? ''),
          confidence: Number(c.confidence ?? 0),
        }))
      : [],
    source: 'model',
    timestamp: data.timestamp ?? new Date().toISOString(),
  };
}

export async function resetBackendSession(): Promise<void> {
  await fetch('/api/reset', { method: 'POST' });
}
