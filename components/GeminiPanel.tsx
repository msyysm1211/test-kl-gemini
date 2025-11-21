import React, { useState } from 'react';
import { BlockMap, SculptureAnalysis, RemixChallenge } from '../types';
import { analyzeSculpture, generateRemix } from '../services/gemini';
import { Sparkles, RefreshCw, AlertCircle, CheckCircle2, ArrowRight, Box, Trophy } from 'lucide-react';

interface GeminiPanelProps {
  blocks: BlockMap;
  onLoadRemix: (newBlocks: BlockMap) => void;
}

const GeminiPanel: React.FC<GeminiPanelProps> = ({ blocks, onLoadRemix }) => {
  const [analysis, setAnalysis] = useState<SculptureAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remix, setRemix] = useState<RemixChallenge | null>(null);

  const handleAnalyze = async () => {
    if (blocks.size === 0) {
        setError("Build something first!");
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeSculpture(blocks);
      setAnalysis(result);
    } catch (e) {
      setError("Failed to analyze. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemix = async () => {
     if (blocks.size === 0) {
        setError("Add blocks to generate a remix inventory!");
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await generateRemix(blocks);
      setRemix(result);
      setAnalysis(null); // Clear analysis to focus on remix
    } catch (e) {
      setError("Failed to generate remix.");
    } finally {
      setLoading(false);
    }
  };

  const applyRemix = () => {
    if (remix) {
      const newMap = new Map<string, string>();
      remix.blocks.forEach(b => {
        newMap.set(`${b.x},${b.y},${b.z}`, b.color);
      });
      onLoadRemix(newMap);
      setRemix(null);
    }
  };

  return (
    <div className="w-80 h-full bg-slate-900/90 backdrop-blur-lg border-l border-slate-700 p-6 overflow-y-auto flex flex-col">
      <div className="mb-6 flex items-center gap-2 text-purple-400">
        <Sparkles size={24} />
        <h2 className="text-lg font-bold text-white">Gemini AI</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-200 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-3 mb-8">
        <button
          onClick={handleAnalyze}
          disabled={loading || blocks.size === 0}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-lg font-semibold text-white shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : <Trophy size={18} />}
          Critique Sculpture
        </button>
        
        <button
          onClick={handleRemix}
          disabled={loading || blocks.size === 0}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg font-semibold text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
           {loading ? <RefreshCw className="animate-spin" size={18} /> : <Box size={18} />}
          Remix Blocks
        </button>
      </div>

      {/* Analysis Result */}
      {analysis && !loading && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-1">{analysis.title}</h3>
            <span className="inline-block px-2 py-1 rounded bg-slate-700 text-xs text-indigo-300 font-medium mb-3">
              {analysis.style}
            </span>
            <p className="text-sm text-slate-300 leading-relaxed">
              {analysis.description}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-700">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-xs text-slate-400 uppercase tracking-wider">Integrity</span>
                 <span className="text-sm font-mono text-emerald-400">{analysis.structuralIntegrity}%</span>
               </div>
               <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${analysis.structuralIntegrity}%` }} 
                  />
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Remix Result */}
      {remix && !loading && (
        <div className="space-y-4 animate-fade-in">
             <div className="p-4 bg-indigo-900/30 rounded-xl border border-indigo-500/30">
                <h3 className="text-lg font-bold text-white mb-2">Blueprint: {remix.name}</h3>
                <p className="text-sm text-slate-300 mb-4">{remix.description}</p>
                
                <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded mb-4">
                     <span className="text-xs text-slate-400">Blocks needed</span>
                     <span className="text-sm font-mono font-bold">{remix.blocks.length}</span>
                </div>

                <button 
                    onClick={applyRemix}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-medium text-white flex items-center justify-center gap-2 transition-colors"
                >
                    Load Blueprint <ArrowRight size={16} />
                </button>
             </div>
        </div>
      )}
      
      <div className="mt-auto pt-6 text-center">
         <p className="text-[10px] text-slate-500">
            Powered by Google Gemini 2.5 Flash
         </p>
      </div>
    </div>
  );
};

export default GeminiPanel;
