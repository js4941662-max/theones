import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import PostInput from './components/PostInput';
import ResponseOutput from './components/ResponseOutput';
import { generateLinkedInReply } from './services/geminiService';
import { StructuredError } from './services/errorHandler';
import type { LinkedInReplyOutput, ErrorResponse } from './types';

const App: React.FC = () => {
  const [originalPost, setOriginalPost] = useState<string>('');
  const [replyOutput, setReplyOutput] = useState<LinkedInReplyOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [error, setError] = useState<ErrorResponse | string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!originalPost.trim()) {
      setError('Please provide the original LinkedIn post.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setReplyOutput(null);
    
    try {
      setLoadingStatus('Analyzing post and author intent...');
      const report = await generateLinkedInReply(originalPost, setLoadingStatus);
      setReplyOutput(report);
    } catch (err) {
      if (err instanceof StructuredError) {
        setError(err.response);
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  }, [originalPost]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-slate-900 to-navy-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />
        <main className="space-y-8">
          <PostInput
            originalPost={originalPost}
            onPostChange={setOriginalPost}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            loadingStatus={loadingStatus}
          />
          <ResponseOutput
            isLoading={isLoading}
            loadingStatus={loadingStatus}
            error={error}
            replyOutput={replyOutput}
          />
        </main>
      </div>
    </div>
  );
};

export default App;