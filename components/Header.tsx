import React from 'react';
import { BrainCircuitIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-navy-900/50 rounded-xl shadow-2xl p-6 mb-8 border border-navy-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
            <BrainCircuitIcon className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-400 text-transparent bg-clip-text">
              LinkedIn Reply Strategist
            </h1>
            <p className="text-slate-400">
              Craft expert, high-engagement replies to any LinkedIn post.
            </p>
          </div>
        </div>
         <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-cyan-400/80">Powered by</p>
            <p className="text-sm font-bold text-slate-300">Gemini 2.5 Pro</p>
        </div>
      </div>
    </header>
  );
};

export default Header;