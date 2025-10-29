import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import PostInput from './components/PostInput';
import ResponseOutput from './components/ResponseOutput';
import { analyzePost, generateLinkedInReply, evaluateReplyQuality } from './services/geminiService';
import { StructuredError } from './services/errorHandler';
import type { ErrorResponse, QualityMetrics, Reference } from './types';

const App: React.FC = () => {
  const [post, setPost] = useState<string>('');
  const [reply, setReply] = useState<string>('');
  const [references, setReferences] = useState<string>('');
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [error, setError] = useState<ErrorResponse | string | null>(null);
  const [isFallbackResponse, setIsFallbackResponse] = useState<boolean>(false);

  const handleGenerate = useCallback(async () => {
    if (!post.trim()) {
      setError('Please paste the content of the LinkedIn post.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setReply('');
    setReferences('');
    setQualityMetrics(null);
    setIsFallbackResponse(false);

    try {
      setLoadingStatus('Phase 1/3: Analyzing post content...');
      const analysisResult = await analyzePost(post);

      setLoadingStatus('Phase 2/3: Generating expert reply...');
      const generationResult = await generateLinkedInReply(post, analysisResult);
      
      setReply(generationResult.reply);
      setIsFallbackResponse(!!generationResult.isFallback);

      const formattedReferences = generationResult.references
        .map(ref => `${ref.number}. ${ref.title}, ${ref.authors} (${ref.year}). *${ref.journal}*. [Link](${ref.url})`)
        .join('\n');
      setReferences(formattedReferences);

      // Skip quality evaluation for static fallback responses
      if (!generationResult.isFallback) {
        setLoadingStatus('Phase 3/3: Evaluating reply quality...');
        const evaluationResult = await evaluateReplyQuality(post, generationResult.reply);
        setQualityMetrics(evaluationResult);
      } else {
        setQualityMetrics(null); // Clear any previous metrics
      }

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
  }, [post]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-slate-900 to-navy-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />
        <main className="space-y-8">
          <PostInput
            post={post}
            onPostChange={setPost}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            loadingStatus={loadingStatus}
          />
          <ResponseOutput
            isLoading={isLoading}
            loadingStatus={loadingStatus}
            error={error}
            reply={reply}
            references={references}
            qualityMetrics={qualityMetrics}
            isFallbackResponse={isFallbackResponse}
          />
        </main>
      </div>
    </div>
  );
};

export default App;