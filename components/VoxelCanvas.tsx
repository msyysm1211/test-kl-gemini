import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BlockMap, ToolMode, Point3D } from '../types';

interface VoxelCanvasProps {
  blocks: BlockMap;
  toolMode: ToolMode;
  selectedColor: string;
  onBlockAction: (pos: Point3D, mode: ToolMode) => void;
}

const TILE_WIDTH = 32;
const TILE_HEIGHT = 16; // Half of width for standard iso
const BLOCK_HEIGHT = 24; // Height of the vertical part of the cube

// Helper to convert grid to screen
const gridToScreen = (x: number, y: number, z: number, originX: number, originY: number) => {
  const screenX = originX + (x - y) * TILE_WIDTH;
  const screenY = originY + (x + y) * TILE_HEIGHT - (z * BLOCK_HEIGHT);
  return { x: screenX, y: screenY };
};

// Helper to draw a single cube
const drawCube = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  isHovered: boolean,
  highlightFace: 'top' | 'left' | 'right' | null
) => {
  // Colors
  const baseColor = color;
  // Simple darkening for shading
  const leftFaceColor = shadeColor(color, -20);
  const rightFaceColor = shadeColor(color, -40);
  const strokeColor = isHovered ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0,0,0,0.1)';

  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = strokeColor;

  // Top Face
  ctx.fillStyle = highlightFace === 'top' ? lightenColor(baseColor, 20) : baseColor;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + TILE_WIDTH, y - TILE_HEIGHT);
  ctx.lineTo(x + TILE_WIDTH * 2, y);
  ctx.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Face
  ctx.fillStyle = highlightFace === 'right' ? lightenColor(rightFaceColor, 20) : rightFaceColor;
  ctx.beginPath();
  ctx.moveTo(x + TILE_WIDTH * 2, y);
  ctx.lineTo(x + TILE_WIDTH * 2, y + BLOCK_HEIGHT);
  ctx.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT + BLOCK_HEIGHT);
  ctx.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Left Face
  ctx.fillStyle = highlightFace === 'left' ? lightenColor(leftFaceColor, 20) : leftFaceColor;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT);
  ctx.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT + BLOCK_HEIGHT);
  ctx.lineTo(x, y + BLOCK_HEIGHT);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

const drawCursor = (
    ctx: CanvasRenderingContext2D,
    gx: number, gy: number, gz: number,
    originX: number, originY: number,
    color: string
) => {
    const { x, y } = gridToScreen(gx, gy, gz, originX, originY);
    ctx.save();
    ctx.globalAlpha = 0.5;
    drawCube(ctx, x, y, color, true, null);
    ctx.restore();
};

// Utility to manipulate colors (simple version)
function shadeColor(color: string, percent: number) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = parseInt((R * (100 + percent) / 100).toString());
  G = parseInt((G * (100 + percent) / 100).toString());
  B = parseInt((B * (100 + percent) / 100).toString());

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
  const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
  const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

  return "#" + RR + GG + BB;
}

function lightenColor(color: string, percent: number) {
    return shadeColor(color, percent);
}

const VoxelCanvas: React.FC<VoxelCanvasProps> = ({ blocks, toolMode, selectedColor, onBlockAction }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<{ gx: number, gy: number, gz: number, face: 'top' | 'left' | 'right' } | null>(null);

  // Determine grid origin (center of screen)
  const getOrigin = (canvas: HTMLCanvasElement) => ({
    x: canvas.width / 2 - TILE_WIDTH, // Adjust for block width center
    y: canvas.height / 2,
  });

  // Hit test helper
  const isPointInRhombus = (px: number, py: number, bx: number, by: number, width: number, height: number) => {
    // Simple bounding box check first
    if (px < bx || px > bx + width * 2 || py < by - height || py > by + height + BLOCK_HEIGHT) return false;
    
    // Use barycentric or detailed polygon check for precise hitting if needed.
    // For now, we'll use a simplified distance check to centers of faces for better usability
    // Top face center: bx + width, by
    // Left face center: bx + width/2, by + height/2 + block_h/2 ... approx
    
    // Actually, let's do color-picking buffer or simpler math.
    // Since it's an iso grid, let's just check the Top Face specifically as it's the main interaction surface usually,
    // but for full 3D we need all faces.
    
    // Let's use a simplified geometric approach for the 3 faces.
    
    // Top Face (Rhombus)
    // Center: (bx + width, by)
    // Check rough proximity
    const dx = px - (bx + width);
    const dy = py - by;
    // Equation of rhombus |dx|/width + |dy|/height <= 1
    const inTop = (Math.abs(dx) / width + Math.abs(dy) / height) <= 1;
    
    if (inTop) return 'top';

    // Left Face (Parallelogramish)
    // Center approx: bx + width/2, by + height + block_h/2
    const lx = px - (bx + width / 2);
    const ly = py - (by + height + BLOCK_HEIGHT / 2);
    // It's roughly a rect in iso projection if we rotate? 
    // Let's just stick to simple bounds for the sides relative to the top check fail.
    if (px >= bx && px <= bx + width && py >= by + height && py <= by + height + BLOCK_HEIGHT) {
         // Check diagonal cut?
         // Simplified: True if in left rect zone
         return 'left';
    }

    // Right Face
    if (px >= bx + width && px <= bx + width * 2 && py >= by + height && py <= by + height + BLOCK_HEIGHT) {
        return 'right';
    }

    return null;
  };


  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const origin = getOrigin(canvas);

    // Convert map to array
    const blockList = Array.from(blocks.entries()).map(([key, color]) => {
      const [x, y, z] = key.split(',').map(Number);
      return { x, y, z, color };
    });

    // Sort: Painter's algorithm (back to front)
    // Z-order: x + y + z (roughly)
    // Actually for isometric: Draw low X, low Y, low Z first.
    // Or simply: (x + y) determines row, z determines height.
    // Lower (x+y) is further back. Lower z is lower down.
    blockList.sort((a, b) => {
      const depthA = (a.x + a.y);
      const depthB = (b.x + b.y);
      if (depthA !== depthB) return depthA - depthB;
      return a.z - b.z;
    });

    let newHover: typeof hoveredBlock = null;

    // Draw blocks
    blockList.forEach((b) => {
      const screen = gridToScreen(b.x, b.y, b.z, origin.x, origin.y);
      
      // Hit detection (Loop logic inside render is okay for small N, 
      // but for interaction we should really do this in the mouseMove handler.
      // However, we need the sorted order for correct occlusion detection!)
      // So we do hit detection in REVERSE draw order here to find the "front-most" block under mouse.
      // But we are in the draw loop (back-to-front).
      
      // We will just Draw here. We calculate hit separately or in a second pass?
      // Let's do a second pass for hit test in Reverse Order inside the MouseMove, not render.
      // Wait, render depends on hover state. 
      
      const isHovered = hoveredBlock?.gx === b.x && hoveredBlock?.gy === b.y && hoveredBlock?.gz === b.z;
      const face = isHovered ? hoveredBlock?.face : null;
      
      drawCube(ctx, screen.x, screen.y, b.color, isHovered, face as any);
    });
    
    // Draw "Ghost" block if in ADD mode and hovering a face
    if (toolMode === ToolMode.ADD && hoveredBlock) {
        let { gx, gy, gz, face } = hoveredBlock;
        if (face === 'top') gz += 1;
        if (face === 'left') gx -= 1; // Or depending on coord sys
        if (face === 'right') gy -= 1; 
        // Wait, coordinate system check:
        // ScreenX = (x - y) * W.  Increasing X moves right-down. Increasing Y moves left-down.
        // Top face is Z+1.
        // Left face: Visually left. Means decreasing Y? No.
        // x axis goes down-right. y axis goes down-left.
        // left face is the YZ plane? No, XZ plane?
        // Let's assume standard:
        // Right face is +X direction (visually right side of cube).
        // Left face is +Y direction (visually left side of cube).
        // Wait. x-y. 
        // If I increase X: screenX increases (Right).
        // If I increase Y: screenX decreases (Left).
        // So Left Face corresponds to increasing Y? Or decreasing X?
        // Usually Left Face corresponds to the face perpendicular to Y axis? 
        // Let's trial and error the ghost block offset:
        
        if (face === 'left') gy += 1; 
        if (face === 'right') gx += 1;
        
        // Prevent duplicate ghost
        const key = `${gx},${gy},${gz}`;
        if (!blocks.has(key)) {
             drawCursor(ctx, gx, gy, gz, origin.x, origin.y, selectedColor);
        }
    }
    
    // Draw Ground Plane Grid (Optional, helps orientation)
    // Can be drawn first in the list effectively.
    
  }, [blocks, hoveredBlock, toolMode, selectedColor]);

  // Hit Test Logic
  useEffect(() => {
      if (!mousePos || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const origin = getOrigin(canvas);
      const blockList = Array.from(blocks.entries()).map(([key, color]) => {
        const [x, y, z] = key.split(',').map(Number);
        return { x, y, z, color };
      });

      // Sort for hit test (Front to Back)
      blockList.sort((a, b) => {
        const depthA = (a.x + a.y);
        const depthB = (b.x + b.y);
        if (depthA !== depthB) return depthB - depthA; // Reverse
        return b.z - a.z; // Reverse
      });

      let found = null;
      for (const b of blockList) {
          const screen = gridToScreen(b.x, b.y, b.z, origin.x, origin.y);
          const hitFace = isPointInRhombus(mousePos.x, mousePos.y, screen.x, screen.y, TILE_WIDTH, TILE_HEIGHT);
          if (hitFace) {
              found = { gx: b.x, gy: b.y, gz: b.z, face: hitFace };
              break; // First hit is closest
          }
      }
      
      // If no block hit, check if we hit the "ground" (z=0) for initial placement?
      if (!found && blocks.size === 0) {
          // Allow placing at 0,0,0 if empty
           // Simple check around center
           const screen = gridToScreen(0, 0, 0, origin.x, origin.y);
           const hitFace = isPointInRhombus(mousePos.x, mousePos.y, screen.x, screen.y, TILE_WIDTH, TILE_HEIGHT);
           if (hitFace) {
               found = { gx: 0, gy: 0, gz: 0, face: 'top' as const };
               // Special case: this block doesn't exist yet, so we treat it as a phantom for adding?
               // Actually, for empty canvas, we usually render a grid.
           }
      }

      setHoveredBlock(found as any);

  }, [mousePos, blocks]);


  // Loop
  useEffect(() => {
    const frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [render]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };
  
  const handleMouseDown = () => {
      if (!hoveredBlock) {
          // If empty, and clicking center
          if (blocks.size === 0) {
             onBlockAction({x:0, y:0, z:0}, ToolMode.ADD);
          }
          return;
      }

      const { gx, gy, gz, face } = hoveredBlock;

      if (toolMode === ToolMode.REMOVE) {
          onBlockAction({ x: gx, y: gy, z: gz }, ToolMode.REMOVE);
      } else if (toolMode === ToolMode.ADD) {
          let nx = gx, ny = gy, nz = gz;
          if (face === 'top') nz++;
          if (face === 'left') ny++; // Y grows down-left
          if (face === 'right') nx++; // X grows down-right
          onBlockAction({ x: nx, y: ny, z: nz }, ToolMode.ADD);
      } else if (toolMode === ToolMode.PAINT) {
          onBlockAction({ x: gx, y: gy, z: gz }, ToolMode.PAINT);
      }
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="cursor-crosshair touch-none w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseLeave={() => setMousePos(null)}
    />
  );
};

export default VoxelCanvas;
