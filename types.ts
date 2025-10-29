
export interface ErrorResponse {
  message: string;
  userMessage: string;
  suggestions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  canRetry: boolean;
  retryDelay?: number;
}

export interface Reference {
  marker: number;
  title: string;
  authors: string;
  year: number;
  journal: string;
  url: string;
}

export interface QualityMetrics {
  scientificAccuracy: number;
  citationRelevance: number;
  technicalDepth: number;
  noveltyOfInsight: number;
  professionalTone: number;
  sourceRelevance: number;
  mechanisticClarity: number;
  strategicInsight: number;
  communicationClarity: number;
}

export interface QualityScore {
  overall: number;
  metrics: QualityMetrics;
}

export type StatusCallback = (status: string) => void;
