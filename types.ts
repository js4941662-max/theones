export interface ErrorResponse {
  message: string;
  userMessage: string;
  suggestions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  canRetry: boolean;
  retryDelay?: number;
}

export type StatusCallback = (status: string) => void;

export interface LinkedInReplyOutput {
  analysis: {
    originalPostSummary: string;
    authorIntent: string;
    targetAudience: string;
    conversationGap: string;
    recommendedLength: string;
    recommendedTone: string;
    includeSources: string;
    strategicApproach: string;
  };
  reply: {
    text: string;
    wordCount: number;
    emoji: string;
    sources?: Array<{
      claim: string;
      citation: string;
      inline: string;
    }>;
  };
  qualityScore: {
    valueAdd: string;
    engagementPotential: string;
    toneAlignment: string;
    credibility: string;
    overall: string;
    risks: string[];
    improvements: string[];
  };
  alternativeVersions: {
    shorter: string;
    longer: string;
    differentTone: string;
  };
  isDemonstration?: boolean;
}