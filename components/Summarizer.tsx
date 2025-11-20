import React, { useState } from 'react';
import { generateSummary } from '../services/geminiService';
import { FileText, ArrowRight, Sparkles, Copy, Check } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

export const Summarizer: React.FC = () => {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const result = await generateSummary(text);
      setSummary(result);
    } catch (e) {
      alert("Error summarizing text");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto p-1">
      
      {/* Input Section */}
      <div className="flex flex-col bg-white dark:bg-dark-card rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
          <FileText size={24} />
          <h2 className="text-xl font-bold">Source Text</h2>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste your lecture notes, essay, or article here..."
          className="flex-1 w-full p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm leading-relaxed"
        ></textarea>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSummarize}
            disabled={!text || isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50"
          >
            {isLoading ? (
                <>Summarizing...</>
            ) : (
                <>
                    <Sparkles size={18} /> Summarize Notes
                </>
            )}
          </button>
        </div>
      </div>

      {/* Output Section */}
      <div className="flex flex-col bg-white dark:bg-dark-card rounded-2xl shadow-lg p-6 relative">
        <div className="flex items-center justify-between mb-4 text-purple-600 dark:text-purple-400">
          <div className="flex items-center gap-3">
            <ArrowRight size={24} className="hidden lg:block" />
            <h2 className="text-xl font-bold">AI Summary</h2>
          </div>
          {summary && (
            <button onClick={handleCopy} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
            </button>
          )}
        </div>
        
        <div className="flex-1 bg-purple-50 dark:bg-gray-800/30 rounded-xl p-4 border border-purple-100 dark:border-gray-700 overflow-y-auto">
          {summary ? (
            <MarkdownRenderer content={summary} className="text-gray-800 dark:text-gray-200" />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <p className="text-center">Your concise summary will appear here.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};