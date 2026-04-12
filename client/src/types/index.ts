/** Shared types for the AI Real-Time Canvas client */

export interface ShapeNode {
  id: string;
  type: 'circle' | 'rectangle';
  x: number;
  y: number;
  radius?: number;
  width?: number;
  height?: number;
  label: string;
  color: string;
}

export interface CanvasState {
  nodes: ShapeNode[];
}

export interface GeneratePayload {
  prompt: string;
}

export interface MovePayload {
  id: string;
  x: number;
  y: number;
}

export interface GeneratedPayload {
  nodes: ShapeNode[];
  prompt: string;
}

export interface ErrorPayload {
  message: string;
}
