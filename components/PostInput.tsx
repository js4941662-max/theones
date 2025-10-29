import React from 'react';
import { SparklesIcon } from './icons';

interface PostInputProps {
  post: string;
  onPostChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  loadingStatus: string;
}

const PostInput: React.FC<PostInputProps> = ({ post, onPostChange, onGenerate, isLoading, loadingStatus }) => {
  return (
    <div className="bg-navy-900/50 rounded-xl shadow-2xl p-6 border border-navy-700 space-y-6">
      <h2 className="text-xl font-bold text-slate-100">1. Paste LinkedIn Post</h2>
      <textarea
        value={post}
        onChange={(e) => onPostChange(e.target.value)}
        placeholder="Paste the full text of the LinkedIn post here..."
        className="w-full h-48 bg-navy-950 p-4 border-2 border-navy-700 rounded-lg focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y font-mono text-sm text-slate-300"
        aria-label="LinkedIn Post Input"
      />
      <button
        onClick={onGenerate}
        disabled={!post.trim() || isLoading}
        className="w-full flex items-center justify-center mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/30"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{loadingStatus || 'Generating...'}</span>
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5 mr-2" />
            Generate Expert Reply
          </>
        )}
      </button>
    </div>
  );
};

export default PostInput;
