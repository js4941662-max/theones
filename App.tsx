
import React, { useState, useCallback } from 'react';
import { BrainCircuitIcon, CheckIcon, SparklesIcon, ExclamationTriangleIcon, LinkIcon } from './components/icons';
import { generateLinkedInReply, evaluateReplyQuality } from './services/geminiService';
import { StructuredError } from './services/errorHandler';
import type { ErrorResponse, QualityScore, Reference, StatusCallback } from './types';

const App: React.FC = () => {
  const [postContent, setPostContent] = useState<string>('');
  const [replyMode, setReplyMode] = useState<'balanced' | 'technical' | 'collaborative'>('balanced');
  const [generatedReply, setGeneratedReply] = useState<string>('');
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
  const [references, setReferences] = useState<Reference[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [error, setError] = useState<ErrorResponse | string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleGenerateReply = useCallback(async () => {
    if (!postContent.trim()) {
      setError('Please enter the post content.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedReply('');
    setQualityScore(null);
    setReferences([]);
    setIsCopied(false);
    setLoadingStatus('Initializing AI cognitive framework...');

    const statusCallback: StatusCallback = (status) => {
        setLoadingStatus(status);
    };

    try {
      const { reply, references: newReferences } = await generateLinkedInReply(postContent, replyMode, statusCallback);
      const replyText = reply.replace(/\[\d+\]/g, (match) => {
          const num = parseInt(match.replace(/[\[\]]/g, ''));
          return `<sup>${num}</sup>`;
      });

      setGeneratedReply(replyText);
      setReferences(newReferences);

      statusCallback('Assessing final output quality...');
      evaluateReplyQuality(postContent, reply, newReferences).then(setQualityScore);

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
  }, [postContent, replyMode]);
  
  const handleCopy = () => {
    // Convert superscripts back to plain text for copying
    const plainTextReply = generatedReply.replace(/<sup>(\d+)<\/sup>/g, '[$1]');
    navigator.clipboard.writeText(plainTextReply);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-slate-900 to-navy-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-navy-900/50 rounded-xl shadow-2xl p-6 mb-8 border border-navy-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
              <BrainCircuitIcon className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-400 text-transparent bg-clip-text">
                MD/PhD-Level LinkedIn Reply Generator
              </h1>
              <p className="text-slate-400">
                v7.0 (Citation Engine)
              </p>
            </div>
          </div>
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-navy-900/50 rounded-xl shadow-2xl p-6 border border-navy-700 space-y-6">
            <h2 className="text-xl font-bold text-slate-100">1. Input Post Content</h2>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Paste the LinkedIn post here... The AI will analyze the content and generate a reply in your expert style."
              className="w-full h-60 bg-navy-950 p-4 border-2 border-navy-700 rounded-lg focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y font-mono text-sm text-slate-300"
            />
            
            <div>
              <label className="block text-lg font-medium text-slate-100 mb-2">
                2. Select Reply Mode
              </label>
              <div className="flex flex-wrap gap-2">
                {(['balanced', 'technical', 'collaborative'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setReplyMode(mode)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                      replyMode === mode
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-navy-800 text-slate-300 hover:bg-navy-700'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleGenerateReply}
              disabled={!postContent.trim() || isLoading}
              className="w-full flex items-center justify-center mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/30"
            >
              {isLoading ? (
                 <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{loadingStatus}</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Generate Reply
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-navy-900/50 rounded-xl shadow-2xl p-6 border border-navy-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-100">Generated Reply</h2>
               {generatedReply && (
                  <button onClick={handleCopy} className="px-3 py-1.5 text-sm font-medium bg-navy-800 text-slate-300 rounded-md hover:bg-navy-700 transition-colors flex items-center">
                    {isCopied ? <CheckIcon className="w-4 h-4 mr-1.5 text-green-400"/> : null}
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
               )}
            </div>
            
            <div className="w-full min-h-[240px] bg-navy-950 p-4 border border-navy-700 rounded-lg overflow-y-auto">
              {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                      <div className="mb-4">
                           <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                      </div>
                      <p className="font-semibold text-slate-200">{loadingStatus}</p>
                      <p className="text-sm text-slate-500 mt-1">This may take a moment...</p>
                   </div>
              ) : error ? (
                   <div className="flex flex-col items-center justify-center h-full text-center text-red-400">
                      <ExclamationTriangleIcon className="w-12 h-12 mb-4" />
                      <p className="font-semibold">Failed to Generate Reply</p>
                      <p className="text-sm text-slate-400 mt-1">{typeof error === 'string' ? error : error.userMessage}</p>
                   </div>
              ) : generatedReply ? (
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed font-serif" dangerouslySetInnerHTML={{ __html: generatedReply }} />
              ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <p>Your AI-generated reply will appear here.</p>
                 </div>
              )}
            </div>
            
            {references.length > 0 && !isLoading && (
              <div className="mt-6 border-t border-navy-700 pt-4">
                <h3 className="font-semibold text-slate-100 mb-2">References</h3>
                <div className="space-y-3">
                  {references.map((ref) => (
                    <div key={ref.marker} className="flex items-start text-sm">
                      <span className="text-slate-500 w-6 flex-shrink-0">{ref.marker}.</span>
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-medium">{ref.title}</span>
                        <span className="text-slate-400 text-xs">{ref.authors} ({ref.year}). {ref.journal}.</span>
                         <a href={ref.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-1 text-cyan-400 hover:underline w-fit">
                           <LinkIcon className="w-3 h-3"/>
                           <span>{new URL(ref.url).hostname}</span>
                         </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
                
            {qualityScore && !isLoading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-100">Quality Assessment</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                    <CheckIcon className="w-4 h-4 text-green-400" />
                    <span className="text-base font-bold text-slate-100">
                      {Math.round(qualityScore.overall)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(qualityScore.metrics).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs sm:text-sm mb-1">
                        <span className="text-slate-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-medium text-slate-200">{Math.round(value as number)}%</span>
                      </div>
                      <div className="w-full bg-navy-800 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${value as number}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
