import type { ErrorResponse } from '../types';

interface ErrorContext {
  operation: string;
  timestamp: number;
  userAction?: string;
  metadata?: Record<string, any>;
}

export class StructuredError extends Error {
  public response: ErrorResponse;
  constructor(response: ErrorResponse) {
    super(response.userMessage);
    this.name = 'StructuredError';
    this.response = response;
  }
}

class EnhancedErrorHandler {
  private errorHistory: Map<string, ErrorContext[]> = new Map();
  private maxHistorySize = 50;

  handleError(error: any, context: ErrorContext): ErrorResponse {
    this.recordError(error, context);
    
    // Analyze error type and provide appropriate response
    if (this.isRateLimitError(error)) {
      return this.handleRateLimitError(error);
    }
    
    if (this.isOverloadError(error)) {
      return this.handleOverloadError(error);
    }
    
    if (this.isAuthenticationError(error)) {
      return this.handleAuthError(error);
    }
    
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error);
    }
    
    if (this.isContentGenerationError(error)) {
        return this.handleContentGenerationError(error);
    }

    return this.handleGenericError(error);
  }

  private isRateLimitError(error: any): boolean {
    const message = (error?.message || '').toLowerCase();
    // Safely access nested properties
    const code = error?.error?.code;
    const status = error?.error?.status?.toLowerCase();

    return code === 429 || 
           status === 'resource_exhausted' ||
           message.includes('quota') ||
           message.includes('rate limit');
  }

  private isOverloadError(error: any): boolean {
     const message = (error?.message || '').toLowerCase();
    return error?.error?.code === 503 ||
           message.includes('overloaded') ||
           message.includes('unavailable');
  }

  private isAuthenticationError(error: any): boolean {
     const message = (error?.message || '').toLowerCase();
    return error?.error?.code === 401 ||
           error?.error?.code === 403 ||
           message.includes('api key');
  }

  private isNetworkError(error: any): boolean {
    const message = (error?.message || '').toLowerCase();
    return message.includes('network') ||
           message.includes('fetch') ||
           error?.name === 'NetworkError';
  }

  private isContentGenerationError(error: any): boolean {
    return error?.name === 'AI_CONTENT_FAILURE' || (error?.message || '').includes('The AI returned an empty response');
  }

  private handleContentGenerationError(error: any): ErrorResponse {
    return {
      message: error.message || 'AI failed to generate content.',
      userMessage: "The AI was unable to generate a reply. This can happen if the post's topic is outside the integrated knowledge base or if the input is ambiguous.",
      suggestions: [
        'Ensure the post is related to the known scientific domains.',
        'Try a different post to see if the issue persists.',
        'If the problem continues, there might be a temporary issue with the AI service.'
      ],
      severity: 'medium',
      canRetry: true,
      retryDelay: 0
    };
  }

  private handleRateLimitError(error: any): ErrorResponse {
    const retryDelay = this.extractRetryDelay(error);
    const message = (error?.message || '').toLowerCase();
    const status = error?.error?.status?.toLowerCase();
    
    const isSearchQuota = message.includes('search_grounding');
    const isHardQuota = message.includes('exceeded your current quota') || status === 'resource_exhausted';

    if (isHardQuota) {
      return {
        message: error.message || 'Hard quota limit exceeded',
        userMessage: "It looks like the current API key has run out of its available quota. To continue, the application needs to be configured with a new API key.",
        suggestions: [
          'I see you\'re trying to provide a new key. That\'s the right instinct! For security reasons, I can\'t accept the key directly here. Instead, you need to update it in the application\'s environment.',
          '**The Solution:** The API key must be set as an environment variable named `API_KEY`. You will need to stop the application, set this variable in your system, and then restart the application.',
          'For more details on managing your keys and usage, please visit the Google AI Studio console.',
        ],
        severity: 'critical',
        canRetry: false,
      };
    }
    
    return {
      message: error.message || 'Rate limit exceeded',
      userMessage: isSearchQuota
        ? 'The daily Google Search quota has been reached. The comment was generated using internal knowledge and may lack recent citations.'
        : `The request limit has been reached. Please wait ${this.formatDelay(retryDelay)} before trying again.`,
      suggestions: [
        isSearchQuota 
          ? 'Comments will still be generated using internal scientific knowledge.'
          : 'Please try again in a few moments.',
        'For higher limits, consider upgrading your plan on ai.google.dev.',
      ],
      severity: isSearchQuota ? 'medium' : 'high',
      canRetry: !isSearchQuota,
      retryDelay
    };
  }

  private handleOverloadError(error: any): ErrorResponse {
    return {
      message: 'Service temporarily overloaded',
      userMessage: 'The AI model is currently experiencing high demand. Please try again in a moment.',
      suggestions: [
        'The system will automatically retry your request a few times.',
        'Peak usage times are typically 9-11 AM and 2-4 PM EST.',
        'For immediate results, try again during off-peak hours.'
      ],
      severity: 'medium',
      canRetry: true,
      retryDelay: 5000
    };
  }

  private handleAuthError(error: any): ErrorResponse {
    const isExpired = (error?.message || '').includes('expired');
    
    return {
      message: 'Authentication failed',
      userMessage: isExpired
        ? 'The API key has expired. Please update it to continue.'
        : 'Authentication failed. Please check your API key configuration.',
      suggestions: [
        'Obtain a new API key from ai.google.dev.',
        'Ensure the API key is correctly set in your environment.',
      ],
      severity: 'critical',
      canRetry: false
    };
  }

  private handleNetworkError(error: any): ErrorResponse {
    return {
      message: 'Network connection error',
      userMessage: 'Unable to connect to the service. Please check your internet connection.',
      suggestions: [
        'Verify your internet connection is active.',
        'Check if you can access other websites.',
        'Try disabling any VPN or proxy if enabled.',
      ],
      severity: 'high',
      canRetry: true,
      retryDelay: 3000
    };
  }

  private handleGenericError(error: any): ErrorResponse {
    const isFrequentError = this.isFrequentError(error.message);
    let userMessage = 'An unexpected error occurred. Please try again.';
    if((error?.message || '').includes('SAFETY')) {
        userMessage = "The response could not be generated due to safety settings.";
    } else if ((error?.message || '').includes('malformed')) {
        userMessage = "The AI returned a malformed response. This can be a temporary issue, please try again.";
    }
    
    return {
      message: error.message || 'An unexpected error occurred',
      userMessage,
      suggestions: isFrequentError
        ? [
            'This error has occurred multiple times. Consider:',
            '1. Simplifying your input text.',
            '2. Refreshing the page.',
            '3. Reporting this issue if it persists.'
          ]
        : [
            'Refresh the page and try again.',
            'Clear your browser cache if the problem continues.',
          ],
      severity: 'medium',
      canRetry: true,
      retryDelay: 2000
    };
  }

  private extractRetryDelay(error: any): number {
    const retryInfo = error?.error?.details?.find(
      (d: any) => d['@type']?.includes('RetryInfo')
    );
    
    if (retryInfo?.retryDelay) {
      const seconds = parseInt(retryInfo.retryDelay.replace('s', ''));
      return seconds * 1000;
    }
    
    const match = (error?.message || '').match(/retry in (\d+\.?\d*)\s*s/i);
    if (match) {
      const value = parseFloat(match[1]);
      return value * 1000;
    }
    
    return 60000; // Default 1 minute
  }

  private formatDelay(ms: number): string {
    if (ms <= 0) return 'now';
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }

  private recordError(error: any, context: ErrorContext): void {
    const errorKey = this.getErrorKey(error);
    const history = this.errorHistory.get(errorKey) || [];
    history.push(context);
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
    this.errorHistory.set(errorKey, history);
  }

  private isFrequentError(errorMessage: string): boolean {
    const errorKey = this.getErrorKey({ message: errorMessage });
    const history = this.errorHistory.get(errorKey) || [];
    const fiveMinutesAgo = Date.now() - 300000;
    const recentErrors = history.filter(ctx => ctx.timestamp > fiveMinutesAgo);
    return recentErrors.length >= 3;
  }

  private getErrorKey(error: any): string {
    if (error?.error?.code) {
      return `code_${error.error.code}`;
    }
    const message = error?.message || error?.toString() || 'unknown';
    return message.substring(0, 50);
  }

  getErrorStatistics() {
    const stats = new Map<string, number>();
    for (const [key, contexts] of this.errorHistory.entries()) {
      stats.set(key, contexts.length);
    }
    return Object.fromEntries(stats);
  }

  clearHistory(): void {
    this.errorHistory.clear();
  }
}

export const errorHandler = new EnhancedErrorHandler();
export default EnhancedErrorHandler;