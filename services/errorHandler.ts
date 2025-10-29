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
      userMessage: "Reply generation halted. The input may be ambiguous or fall outside of operational parameters.",
      suggestions: [
        'Refine the original post content and resubmit.',
        'Ensure the post does not contain unusual formatting.',
        'If the issue persists, the topic may be restricted by safety policies.'
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
        userMessage: "The current API key has exhausted its available quota. Operations cannot continue until the key is updated.",
        suggestions: [
          'The API key must be replaced in the application\'s environment configuration.',
          'Visit the Google AI Studio console to manage billing and API keys.',
        ],
        severity: 'critical',
        canRetry: false,
      };
    }
    
    return {
      message: error.message || 'Rate limit exceeded',
      userMessage: isSearchQuota
        ? 'The daily Google Search quota has been reached. The comment was generated using internal knowledge and may lack recent citations.'
        : `Request limit reached. Stand by for retry in ${this.formatDelay(retryDelay)}.`,
      suggestions: [
        isSearchQuota 
          ? 'Comments will still be generated using internal scientific knowledge.'
          : 'Please wait for the automatic retry.',
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
      userMessage: 'The AI model is at maximum capacity. Please wait for a moment.',
      suggestions: [
        'The system will automatically retry your request.',
        'Consider retrying during off-peak hours for immediate results.',
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
        ? 'The API key has expired. Update it to restore functionality.'
        : 'Authentication failed. Verify API key configuration.',
      suggestions: [
        'Obtain a new API key from ai.google.dev.',
        'Ensure the API key is correctly set in the environment.',
      ],
      severity: 'critical',
      canRetry: false
    };
  }

  private handleNetworkError(error: any): ErrorResponse {
    return {
      message: 'Network connection error',
      userMessage: 'Connection to the service failed. Check your network status.',
      suggestions: [
        'Verify your internet connection is active.',
        'Check for any active firewalls, VPNs, or proxies.',
      ],
      severity: 'high',
      canRetry: true,
      retryDelay: 3000
    };
  }

  private handleGenericError(error: any): ErrorResponse {
    let userMessage = 'Execution failed due to an unexpected issue. Please verify input and try again.';
    if((error?.message || '').includes('SAFETY')) {
        userMessage = "Execution halted by safety protocols. The response could not be generated.";
    } else if ((error?.message || '').includes('malformed')) {
        userMessage = "The AI returned a malformed response. This is a transient error. Please try again.";
    }
    
    return {
      message: error.message || 'An unexpected error occurred',
      userMessage,
      suggestions: [
        'Retry the operation.',
        'If the problem persists, consider simplifying the input post.',
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
}

export const errorHandler = new EnhancedErrorHandler();