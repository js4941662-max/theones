import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, CopyIcon, CheckIcon, LightbulbIcon, ShieldCheckIcon, TargetIcon, ChartBarIcon } from './icons';
import type { LinkedInReplyOutput, ErrorResponse } from '../types';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            active
                ? 'bg-cyan-500/10 text-cyan-300'
                : 'text-slate-400 hover:bg-navy-800'
        }`}
    >
        {children}
    </button>
);

const ScoreDisplay: React.FC<{ label: string; score: string }> = ({ label, score }) => {
    const [valueStr, maxStr] = score.split('/');
    const value = parseFloat(valueStr);
    const max = parseInt(maxStr, 10);
    const percentage = (value / max) * 100;
    
    let color = 'bg-cyan-500';
    if (percentage < 40) color = 'bg-red-500';
    else if (percentage < 70) color = 'bg-yellow-500';

    return (
        <div>
            <div className="flex justify-between items-center text-sm mb-1">
                <span className="font-semibold text-slate-300">{label}</span>
                <span className="font-bold text-slate-200">{score}</span>
            </div>
            <div className="w-full bg-navy-950 rounded-full h-2">
                <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const ResponseOutput: React.FC<{
  isLoading: boolean;
  loadingStatus: string;
  error: ErrorResponse | string | null;
  replyOutput: LinkedInReplyOutput | null;
}> = ({ isLoading, loadingStatus, error, replyOutput }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'quality' | 'alternatives'>('analysis');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (replyOutput) {
      setActiveTab('analysis');
      setCopied(false);
    }
  }, [replyOutput]);

  const handleCopy = () => {
    if (replyOutput?.reply.text) {
      navigator.clipboard.writeText(replyOutput.reply.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
            <p className="text-sm text-slate-500 mt-1">AI Strategist is crafting the perfect reply...</p>
         </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 rounded-xl shadow-2xl p-6 border border-red-500/50 min-h-[300px] flex flex-col items-center justify-center text-center">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mb-4" />
        <p className="font-semibold text-red-300 text-lg">Reply Generation Failed</p>
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

  if (!replyOutput) {
    return (
      <div className="bg-navy-900/50 rounded-xl shadow-2xl p-6 border border-navy-700 min-h-[300px] flex flex-col items-center justify-center text-slate-500">
        <p>Your generated LinkedIn reply will appear here.</p>
      </div>
    );
  }

  const { analysis, reply, qualityScore, alternativeVersions, isDemonstration } = replyOutput;

  return (
    <div className="bg-navy-900/50 rounded-xl shadow-2xl p-6 border border-navy-700 space-y-6">
       {isDemonstration && (
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 text-center">
          <p className="font-bold text-yellow-300">Demonstration Mode</p>
          <p className="text-sm text-yellow-400/80 mt-1">The live API quota has been reached. A high-quality example is being shown to demonstrate full functionality.</p>
        </div>
      )}

        <h2 className="text-xl font-bold text-slate-100">2. Generated Reply & Analysis</h2>
        
        <div className="bg-navy-950 p-4 border-2 border-cyan-500/30 rounded-lg space-y-4 relative group">
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed font-serif">{reply.text}</p>
            <button onClick={handleCopy} className="absolute top-2 right-2 p-2 bg-navy-800 rounded-md text-slate-400 hover:bg-navy-700 hover:text-white transition opacity-0 group-hover:opacity-100">
                {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
            </button>
        </div>

        <div className="border-b border-navy-700 flex items-center gap-2">
            <TabButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}>Strategic Analysis</TabButton>
            <TabButton active={activeTab === 'quality'} onClick={() => setActiveTab('quality')}>Quality Score</TabButton>
            <TabButton active={activeTab === 'alternatives'} onClick={() => setActiveTab('alternatives')}>Alternatives</TabButton>
        </div>
        
        <div>
            {activeTab === 'analysis' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {Object.entries(analysis).map(([key, value]) => (
                        <div key={key} className="bg-navy-950 p-3 border border-navy-700 rounded-lg">
                            <p className="font-bold capitalize text-slate-400 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <p className="text-slate-300">{value}</p>
                        </div>
                    ))}
                </div>
            )}
            {activeTab === 'quality' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-300">Metrics</h3>
                        <ScoreDisplay label="Value Add" score={qualityScore.valueAdd} />
                        <ScoreDisplay label="Engagement Potential" score={qualityScore.engagementPotential} />
                        <ScoreDisplay label="Tone Alignment" score={qualityScore.toneAlignment} />
                        <ScoreDisplay label="Credibility" score={qualityScore.credibility} />
                         <div className="pt-2">
                             <ScoreDisplay label="Overall" score={qualityScore.overall} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {qualityScore.improvements?.length > 0 && (
                             <div>
                                <h3 className="font-bold text-slate-300 mb-2 flex items-center gap-2"><LightbulbIcon className="w-5 h-5 text-yellow-400" /> Improvements</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                                    {qualityScore.improvements.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                        )}
                         {qualityScore.risks?.length > 0 && (
                             <div>
                                <h3 className="font-bold text-slate-300 mb-2 flex items-center gap-2"><ShieldCheckIcon className="w-5 h-5 text-red-400" /> Risks</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                                    {qualityScore.risks.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                 </div>
            )}
            {activeTab === 'alternatives' && (
                <div className="space-y-4">
                    <div className="bg-navy-950 p-4 border border-navy-700 rounded-lg">
                        <h3 className="font-bold text-slate-300 mb-2">Shorter Version</h3>
                        <p className="text-sm text-slate-400 whitespace-pre-wrap font-serif">{alternativeVersions.shorter}</p>
                    </div>
                     <div className="bg-navy-950 p-4 border border-navy-700 rounded-lg">
                        <h3 className="font-bold text-slate-300 mb-2">Longer Version</h3>
                        <p className="text-sm text-slate-400 whitespace-pre-wrap font-serif">{alternativeVersions.longer}</p>
                    </div>
                     <div className="bg-navy-950 p-4 border border-navy-700 rounded-lg">
                        <h3 className="font-bold text-slate-300 mb-2">Different Tone</h3>
                        <p className="text-sm text-slate-400 whitespace-pre-wrap font-serif">{alternativeVersions.differentTone}</p>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default ResponseOutput;