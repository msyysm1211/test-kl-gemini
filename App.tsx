import React, { useState, useCallback } from 'react';
import VoxelCanvas from './components/VoxelCanvas';
import Toolbar from './components/Toolbar';
import GeminiPanel from './components/GeminiPanel';
import { BlockMap, ToolMode, PALETTE, Point3D } from './types';
import { HelpCircle } from 'lucide-react';

const App: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockMap>(new Map());
  // Initial seed block if needed, but starting empty is fine. 
  // Or start with one center block to make it easy
  React.useEffect(() => {
      setBlocks(new Map([["0,0,0", PALETTE[4]]]));
  }, []);

  const [toolMode, setToolMode] = useState<ToolMode>(ToolMode.ADD);
  const [selectedColor, setSelectedColor] = useState<string>(PALETTE[0]);
  const [history, setHistory] = useState<BlockMap[]>([]);

  const updateBlocks = (newBlocks: BlockMap) => {
      setHistory(prev => [...prev.slice(-9), new Map(blocks)]); // Keep last 10
      setBlocks(newBlocks);
  };

  const handleBlockAction = useCallback((pos: Point3D, mode: ToolMode) => {
    const key = `${pos.x},${pos.y},${pos.z}`;
    
    setBlocks((prev) => {
        const next = new Map(prev);
        if (mode === ToolMode.ADD) {
            if (!next.has(key)) {
                setHistory(h => [...h.slice(-19), new Map(prev)]); // Save history before change
                next.set(key, selectedColor);
            }
        } else if (mode === ToolMode.REMOVE) {
            if (next.has(key)) {
                setHistory(h => [...h.slice(-19), new Map(prev)]);
                next.delete(key);
            }
        } else if (mode === ToolMode.PAINT) {
            if (next.has(key) && next.get(key) !== selectedColor) {
                setHistory(h => [...h.slice(-19), new Map(prev)]);
                next.set(key, selectedColor);
            }
        }
        return next;
    });
  }, [selectedColor]);

  const handleUndo = () => {
      if (history.length > 0) {
          const previous = history[history.length - 1];
          setBlocks(previous);
          setHistory(prev => prev.slice(0, -1));
      }
  };

  const handleClear = () => {
      updateBlocks(new Map());
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950">
      {/* Left Toolbar */}
      <Toolbar
        mode={toolMode}
        setMode={setToolMode}
        color={selectedColor}
        setColor={setSelectedColor}
        onClear={handleClear}
        onUndo={handleUndo}
        blockCount={blocks.size}
      />

      {/* Center Canvas */}
      <div className="flex-1 relative bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center overflow-hidden">
         {/* Header / Title Overlay */}
         <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none opacity-50">
             <h1 className="text-4xl font-extrabold text-white tracking-tighter opacity-10">VOXEL</h1>
         </div>

         {/* Controls Hint */}
         <div className="absolute bottom-8 left-8 z-10 pointer-events-none text-slate-500 text-xs flex flex-col gap-1">
             <div className="flex items-center gap-2"><span className="w-4 h-4 bg-slate-800 rounded flex items-center justify-center border border-slate-700">L</span> <span>Click to Add/Remove</span></div>
             <p>Hover faces to guide placement</p>
         </div>

         <VoxelCanvas 
            blocks={blocks}
            toolMode={toolMode}
            selectedColor={selectedColor}
            onBlockAction={handleBlockAction}
         />
      </div>

      {/* Right AI Panel */}
      <GeminiPanel 
        blocks={blocks}
        onLoadRemix={(newBlocks) => {
            setHistory(h => [...h, new Map(blocks)]);
            setBlocks(newBlocks);
        }}
      />

      {/* API Key Check Modal (Simplified logic: Assume Env Var for this demo format, 
          but in real app we might need user input if no env var) */}
    </div>
  );
};

export default App;
