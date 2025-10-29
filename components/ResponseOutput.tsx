import React, { useState } from 'react';
import { ExclamationTriangleIcon, CopyIcon, CheckIcon, ShieldCheckIcon, TargetIcon, LightbulbIcon, MicroscopeIcon, LinkIcon, ZapIcon } from './icons';
import type { ErrorResponse, QualityMetrics, QualityScore } from '../types';

interface ResponseOutputProps {
  isLoading: boolean;
  loadingStatus: string;
  error: ErrorResponse | string | null;
  reply: string;
  references: string;
  qualityMetrics: QualityMetrics | null;
  isFallbackResponse: boolean;
}

const QualityBar: React.FC<{ score: number }> = ({ score }) => {
  const width = `${score}%`;
  let bgColor = 'bg-green-500';
  if (score < 50) bgColor = 'bg-red-500';
  else if (score < 75) bgColor = 'bg-yellow-500';

  return (
    <div className="w-full bg-navy-700 rounded-full h-2.5">
      <div className={`${bgColor} h-2.5 rounded-full`} style={{ width }}></div>
    </div>
  );
};

const MetricDisplay: React.FC<{ icon: React.ReactNode, metric: QualityScore }> = ({ icon, metric }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <div className="flex items-center gap-2">
        {icon}
        <p className="font-semibold text-slate-300">{metric.score}/100</p>
      </div>
    </div>
    <QualityBar score={metric.score} />
    <p className="text-xs text-slate-400 mt-1.5">{metric.justification}</p>
  </div>
);


const ResponseOutput: React.FC<ResponseOutputProps> = ({ isLoading, loadingStatus, error, reply, references, qualityMetrics, isFallbackResponse }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reply);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  if (isLoading) {
    return (
       <div className="bg-navy-900/50 rounded-xl shadow-2xl p-6 border border-navy-700 min-h-[300px] flex flex-col items-center justify-center text-center">
            <div className="mb-4">
                 <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <p className="font-semibold text-slate-200">{loadingStatus}</p>
            <p className="text-sm text-slate-500 mt-1">AI inference network is processing...</p>
         </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 rounded-xl shadow-2xl p-6 border border-red-500/50 min-h-[300px] flex flex-col items-center justify-center text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mb-4" />
        <p className="font-semibold text-red-300 text-lg">Failed to Generate Reply</p>
        <p className="text-sm text-slate-300 mt-1 mb-4 max-w-md">
          {typeof error === 'string' ? error : error.userMessage}
        </p>
        {typeof error !== 'string' && error.suggestions && (
          <div className="text-left text-xs bg-navy-800 p-3 rounded-lg border border-navy-700 space-y-2 max-w-md">
            {error.suggestions.map((s, i) => <p key={i} className="text-slate-400">{s}</p>)}
          </div>
        )}
      </div>
    );
  }

  if (!reply) {
    return (
      <div className="bg-navy-900/50 rounded-xl shadow-2xl p-6 border border-navy-700 min-h-[300px] flex flex-col items-center justify-center text-slate-500">
        <p>Your AI-generated expert reply will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-navy-900/50 rounded-xl shadow-2xl p-6 border border-navy-700 space-y-8">
        {isFallbackResponse && (
          <div className="bg-yellow-900/30 border border-yellow-500/50 text-yellow-200 text-sm rounded-lg p-3 flex items-start gap-3">
            <ZapIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-400"/>
            <div>
              <h4 className="font-bold">Static Fallback Activated</h4>
              <p className="text-yellow-300/80">API quota limit was detected. This reply was generated using the internal knowledge base to ensure a successful response.</p>
            </div>
          </div>
        )}
        <div>
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-bold text-slate-100">2. Generated Reply</h2>
                <button onClick={handleCopy} className="px-3 py-1.5 text-sm font-medium bg-navy-800 text-slate-300 rounded-md hover:bg-navy-700 transition-colors flex items-center">
                    {isCopied ? <CheckIcon className="w-4 h-4 mr-1.5 text-green-400"/> : <CopyIcon className="w-4 h-4 mr-1.5"/>}
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <div className="bg-navy-950 p-4 border border-navy-700 rounded-lg space-y-4">
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed font-serif">{reply}</p>
            </div>
        </div>
        
        {qualityMetrics && (
            <div>
                <h3 className="text-lg font-bold text-slate-200 mb-3">3. Quality Evaluation (Overall: {qualityMetrics.overallScore.toFixed(0)}/100)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-navy-950 p-4 border border-navy-700 rounded-lg">
                    <MetricDisplay icon={<ShieldCheckIcon className="w-5 h-5 text-cyan-400" />} metric={qualityMetrics.adherenceToStyle} />
                    <MetricDisplay icon={<MicroscopeIcon className="w-5 h-5 text-cyan-400" />} metric={qualityMetrics.technicalDepth} />
                    <MetricDisplay icon={<LinkIcon className="w-5 h-5 text-cyan-400" />} metric={qualityMetrics.citationQuality} />
                    <MetricDisplay icon={<LightbulbIcon className="w-5 h-5 text-cyan-400" />} metric={qualityMetrics.strategicQuestion} />
                </div>
            </div>
        )}

        {references && (
            <div>
                <h3 className="text-lg font-bold text-slate-200 mb-3">4. References</h3>
                <div className="bg-navy-950 p-4 border border-navy-700 rounded-lg space-y-2">
                    <p className="text-slate-400 whitespace-pre-wrap text-sm">{references}</p>
                </div>
            </div>
        )}
    </div>
  );
};

export default ResponseOutput;