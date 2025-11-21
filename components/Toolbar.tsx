import React from 'react';
import { ToolMode, PALETTE } from '../types';
import { Eraser, PaintBucket, PlusSquare, RefreshCw, Trash2 } from 'lucide-react';

interface ToolbarProps {
  mode: ToolMode;
  setMode: (m: ToolMode) => void;
  color: string;
  setColor: (c: string) => void;
  onClear: () => void;
  onUndo: () => void;
  blockCount: number;
}

const Toolbar: React.FC<ToolbarProps> = ({ mode, setMode, color, setColor, onClear, onUndo, blockCount }) => {
  return (
    <div className="flex flex-col gap-6 p-4 bg-slate-800/90 backdrop-blur-md border-r border-slate-700 h-full w-64 shadow-xl overflow-y-auto">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-white tracking-tight">VoxelArchitect</h1>
        <p className="text-xs text-slate-400">AI-Powered Sculpture</p>
      </div>

      {/* Stats */}
      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
        <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Block Count</div>
        <div className="text-2xl font-mono text-white">{blockCount}</div>
      </div>

      {/* Tools */}
      <div className="space-y-2">
        <label className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Tools</label>
        <div className="flex gap-2">
            <button 
                onClick={() => setMode(ToolMode.ADD)}
                className={`flex-1 p-3 rounded-md transition-all flex justify-center ${mode === ToolMode.ADD ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                title="Add Block"
            >
                <PlusSquare size={20} />
            </button>
            <button 
                onClick={() => setMode(ToolMode.REMOVE)}
                className={`flex-1 p-3 rounded-md transition-all flex justify-center ${mode === ToolMode.REMOVE ? 'bg-red-500 text-white shadow-lg shadow-red-900/20' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                title="Remove Block"
            >
                <Eraser size={20} />
            </button>
             <button 
                onClick={() => setMode(ToolMode.PAINT)}
                className={`flex-1 p-3 rounded-md transition-all flex justify-center ${mode === ToolMode.PAINT ? 'bg-purple-500 text-white shadow-lg shadow-purple-900/20' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                title="Paint Block"
            >
                <PaintBucket size={20} />
            </button>
        </div>
      </div>

      {/* Palette */}
      <div className="space-y-2">
        <label className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Palette</label>
        <div className="grid grid-cols-5 gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white shadow-md scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto space-y-2 pt-4 border-t border-slate-700">
         <button 
            onClick={onUndo}
            className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
         >
            <RefreshCw size={16} /> Undo Last
         </button>
         <button 
            onClick={onClear}
            className="w-full py-2 px-4 bg-slate-900 hover:bg-red-900/50 text-red-400 hover:text-red-300 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700 hover:border-red-900"
         >
            <Trash2 size={16} /> Clear All
         </button>
      </div>
    </div>
  );
};

export default Toolbar;
