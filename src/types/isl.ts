export type NavSection =
  | 'landing'
  | 'overview'
  | 'translator'
  | 'text-to-isl'
  | 'history'
  | 'emergency'
  | 'about';

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'permission-denied'
  | 'unavailable'
  | 'error';

export type RecognitionStatus =
  | 'idle'
  | 'buffering'
  | 'inferring'
  | 'active'
  | 'paused'
  | 'backend-offline'
  | 'error';

export interface TopCandidate {
  classId: number;
  label: string;
  confidence: number;
}

export interface PredictionResult {
  sign: string;
  englishText: string;
  classId: number;
  confidence: number | null;
  belowThreshold: boolean;
  sequenceFramesUsed: number;
  topCandidates: TopCandidate[];
  source: 'model' | 'demo';
  timestamp: string;
  note?: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'standby' | 'error';
  proxyServer: string;
  fastapiConnected: boolean;
  modelLoaded: boolean;
  mode: string;
  message: string;
  extractorReady?: boolean;
}

export interface ModelInspection {
  modelId: string;
  modelFile: string;
  companionClassifierRepo: string;
  companionClassifierFile: string;
  datasetSource: string;
  datasetName: string;
  fileSizeBytes: number;
  fileSizeHuman: string;
  kerasVersion: string;
  dateSaved: string;
  reportedTestAccuracy: number;
  finalValAccuracy: number;
  totalEpochsLogged: number;
  sequenceLength: number;
  featuresPerFrame: number;
  expectedInputShape: Array<number | null>;
  featureBreakdown: {
    bodyKeypoints: string;
    leftHandKeypoints: string;
    rightHandKeypoints: string;
  };
  classifierArchitecture: string[];
  securityAudit: {
    safeModeRequired: boolean;
    safeDeserializationBypassed: boolean;
    rootConfigClass: string;
    rootConfigModule: string;
    lambdaLayersDetected: boolean;
    notes: string;
  };
  numClasses: number;
  supportedClasses: string[];
}

export interface ModelInfoResponse {
  fastapiConnected: boolean;
  modelLoaded: boolean;
  status: string;
  inspection: ModelInspection;
}

export interface HistoryEntry {
  id: string;
  sign: string;
  englishText: string;
  confidence: number | null;
  source: 'model' | 'demo';
  timestamp: string;
}

export interface IslClassEntry {
  id: number;
  label: string;
  category: string;
  f1: number | null;
  precision: number | null;
  recall: number | null;
  support: number | null;
  sampleVideo: string | null;
  sampleFrames: number | null;
}

export interface TrainingEpoch {
  epoch: number;
  accuracy: number;
  loss: number;
  valAccuracy: number;
  valLoss: number;
}
