export interface ErrorResponse {
  message: string;
  userMessage: string;
  suggestions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  canRetry: boolean;
  retryDelay?: number;
}

export interface AnalysisResult {
  topic: string;
  domain: 'Virology' | 'Molecular Biology' | 'Bioinformatics' | 'General';
  summary: string;
}

export interface Reference {
  number: number;
  title: string;
  authors: string;
  year: number;
  journal: string;
  url: string;
}

export interface GenerationResult {
  reply: string;
  references: Reference[];
  isFallback?: boolean; // Indicates if the reply was generated from the static fallback
}

export interface QualityScore {
  score: number; // A number from 0 to 100
  justification: string;
}

export interface QualityMetrics {
  adherenceToStyle: QualityScore;
  technicalDepth: QualityScore;
  citationQuality: QualityScore;
  strategicQuestion: QualityScore;
  overallScore: number; // Average score
}

export type StatusCallback = (status: string) => void;