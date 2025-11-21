export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Block extends Point3D {
  color: string;
  id: string; // Unique ID for React keys or tracking
}

export type BlockMap = Map<string, string>; // Key: "x,y,z", Value: color

export interface SculptureAnalysis {
  title: string;
  description: string;
  style: string;
  structuralIntegrity: number; // 0-100
}

export interface RemixChallenge {
  name: string;
  description: string;
  targetBlocks: Block[];
}

export enum ToolMode {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  PAINT = 'PAINT',
}

export const PALETTE = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#94a3b8', // Slate
  '#1e293b', // Dark
];
