import { ShapeNode } from '../types/index.js';
import { v4Fallback } from './helpers.js';

/**
 * Color palette for generated shapes — curated, vibrant, and harmonious
 */
const COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#14b8a6', // Teal
  '#ef4444', // Red
];

const CANVAS_W = 900;
const CANVAS_H = 550;
const SHAPE_R = 30;
const RECT_W = 80;
const RECT_H = 50;

function genId(): string {
  return v4Fallback();
}

function pickColor(i: number): string {
  return COLORS[i % COLORS.length];
}

function clampLabel(label: string): string {
  return label.slice(0, 2);
}

/**
 * Parse numbers from a prompt string
 */
function extractNumber(prompt: string, fallback: number): number {
  const match = prompt.match(/(\d+)/);
  return match ? Math.min(parseInt(match[1], 10), 12) : fallback;
}

/**
 * Generate shapes for a "star" / "center + surrounding" layout
 */
function starLayout(prompt: string): ShapeNode[] {
  const lower = prompt.toLowerCase();
  const nodes: ShapeNode[] = [];

  // Determine total count
  let surrounding = 6;
  const surroundMatch = lower.match(/(\d+)\s*surround/);
  if (surroundMatch) surrounding = Math.min(parseInt(surroundMatch[1], 10), 11);

  const totalMatch = lower.match(/(\d+)\s*node/);
  if (totalMatch && !surroundMatch) {
    const total = Math.min(parseInt(totalMatch[1], 10), 12);
    surrounding = total - 1;
  }

  const numMatch = lower.match(/(\d+)\s*(?:circle|rect)/);
  if (numMatch && !surroundMatch && !totalMatch) {
    surrounding = Math.min(parseInt(numMatch[1], 10), 11);
  }

  surrounding = Math.max(1, Math.min(surrounding, 11));

  const useRect = lower.includes('rect');
  const centerX = CANVAS_W / 2;
  const centerY = CANVAS_H / 2;
  const radius = Math.min(CANVAS_W, CANVAS_H) * 0.3;

  // Center node
  nodes.push({
    id: genId(),
    type: useRect ? 'rectangle' : 'circle',
    x: centerX,
    y: centerY,
    radius: SHAPE_R + 4,
    width: RECT_W + 10,
    height: RECT_H + 10,
    label: '★',
    color: pickColor(0),
  });

  // Surrounding nodes
  for (let i = 0; i < surrounding; i++) {
    const angle = (2 * Math.PI * i) / surrounding - Math.PI / 2;
    nodes.push({
      id: genId(),
      type: useRect ? 'rectangle' : 'circle',
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      radius: SHAPE_R,
      width: RECT_W,
      height: RECT_H,
      label: clampLabel(String.fromCharCode(65 + i)),
      color: pickColor(i + 1),
    });
  }

  return nodes;
}

/**
 * Generate shapes in a grid layout
 */
function gridLayout(prompt: string): ShapeNode[] {
  const lower = prompt.toLowerCase();
  const nodes: ShapeNode[] = [];

  let cols = 4;
  let rows = 3;

  // Check for NxM pattern
  const gridMatch = lower.match(/(\d+)\s*[x×]\s*(\d+)/);
  if (gridMatch) {
    cols = parseInt(gridMatch[1], 10);
    rows = parseInt(gridMatch[2], 10);
  }

  const total = Math.min(cols * rows, 12);
  cols = Math.min(cols, 6);
  rows = Math.ceil(total / cols);

  const useRect = lower.includes('rect');
  const paddingX = 100;
  const paddingY = 80;
  const spacingX = (CANVAS_W - 2 * paddingX) / Math.max(cols - 1, 1);
  const spacingY = (CANVAS_H - 2 * paddingY) / Math.max(rows - 1, 1);

  let count = 0;
  for (let r = 0; r < rows && count < total; r++) {
    for (let c = 0; c < cols && count < total; c++) {
      nodes.push({
        id: genId(),
        type: useRect ? 'rectangle' : 'circle',
        x: paddingX + c * spacingX,
        y: paddingY + r * spacingY,
        radius: SHAPE_R - 4,
        width: RECT_W - 10,
        height: RECT_H - 5,
        label: clampLabel(String.fromCharCode(65 + count)),
        color: pickColor(count),
      });
      count++;
    }
  }

  return nodes;
}

/**
 * Generate shapes in a row layout
 */
function rowLayout(prompt: string): ShapeNode[] {
  const lower = prompt.toLowerCase();
  const nodes: ShapeNode[] = [];

  const count = extractNumber(lower, 4);
  const total = Math.min(count, 12);
  const useRect = lower.includes('rect');
  const useCircle = lower.includes('circle');

  const paddingX = 100;
  const spacing = (CANVAS_W - 2 * paddingX) / Math.max(total - 1, 1);
  const centerY = CANVAS_H / 2;

  // Check for "circle above center" pattern
  const hasAbove = lower.includes('above') || lower.includes('top');

  let mainCount = total;
  if (hasAbove && useCircle) mainCount = Math.max(total - 1, 1);

  for (let i = 0; i < mainCount; i++) {
    nodes.push({
      id: genId(),
      type: useRect && !useCircle ? 'rectangle' : (useCircle ? 'circle' : 'rectangle'),
      x: paddingX + i * ((CANVAS_W - 2 * paddingX) / Math.max(mainCount - 1, 1)),
      y: centerY + 40,
      radius: SHAPE_R,
      width: RECT_W,
      height: RECT_H,
      label: clampLabel(String.fromCharCode(65 + i)),
      color: pickColor(i),
    });
  }

  if (hasAbove) {
    nodes.push({
      id: genId(),
      type: 'circle',
      x: CANVAS_W / 2,
      y: centerY - 100,
      radius: SHAPE_R,
      width: RECT_W,
      height: RECT_H,
      label: clampLabel(String.fromCharCode(65 + mainCount)),
      color: pickColor(mainCount),
    });
  }

  return nodes;
}

/**
 * Handle "4 rectangles in a row and 1 circle above center" style prompt
 */
function mixedLayout(prompt: string): ShapeNode[] {
  const lower = prompt.toLowerCase();
  const nodes: ShapeNode[] = [];

  // Parse rectangle count
  const rectMatch = lower.match(/(\d+)\s*rect/);
  const rectCount = rectMatch ? Math.min(parseInt(rectMatch[1], 10), 11) : 4;

  // Parse circle count
  const circleMatch = lower.match(/(\d+)\s*circle/);
  const circleCount = circleMatch ? Math.min(parseInt(circleMatch[1], 10), 12 - rectCount) : 1;

  const paddingX = 120;
  const rectSpacing = (CANVAS_W - 2 * paddingX) / Math.max(rectCount - 1, 1);
  const rowY = CANVAS_H / 2 + 50;

  for (let i = 0; i < rectCount; i++) {
    nodes.push({
      id: genId(),
      type: 'rectangle',
      x: paddingX + i * rectSpacing,
      y: rowY,
      width: RECT_W,
      height: RECT_H,
      label: clampLabel(String.fromCharCode(65 + i)),
      color: pickColor(i),
    });
  }

  const circleY = CANVAS_H / 2 - 80;
  const circleSpacing = (CANVAS_W - 2 * paddingX) / Math.max(circleCount - 1, 1);

  for (let i = 0; i < circleCount; i++) {
    nodes.push({
      id: genId(),
      type: 'circle',
      x: circleCount === 1 ? CANVAS_W / 2 : paddingX + i * circleSpacing,
      y: circleY,
      radius: SHAPE_R,
      label: clampLabel(String.fromCharCode(65 + rectCount + i)),
      color: pickColor(rectCount + i),
    });
  }

  return nodes;
}

/**
 * Default generic layout — scatter shapes evenly
 */
function defaultLayout(prompt: string): ShapeNode[] {
  const lower = prompt.toLowerCase();
  const count = Math.min(extractNumber(lower, 5), 12);
  const useRect = lower.includes('rect');
  const nodes: ShapeNode[] = [];

  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const spacingX = CANVAS_W / (cols + 1);
  const spacingY = CANVAS_H / (rows + 1);

  let idx = 0;
  for (let r = 0; r < rows && idx < count; r++) {
    for (let c = 0; c < cols && idx < count; c++) {
      nodes.push({
        id: genId(),
        type: useRect ? 'rectangle' : 'circle',
        x: spacingX * (c + 1),
        y: spacingY * (r + 1),
        radius: SHAPE_R,
        width: RECT_W,
        height: RECT_H,
        label: clampLabel(String.fromCharCode(65 + idx)),
        color: pickColor(idx),
      });
      idx++;
    }
  }

  return nodes;
}

/**
 * Main fallback function: parses prompt and returns shapes
 */
export function generateShapesFallback(prompt: string): ShapeNode[] {
  const lower = prompt.toLowerCase();

  // Detect mixed layouts like "4 rectangles in a row and 1 circle above"
  if (lower.includes('rect') && lower.includes('circle')) {
    return mixedLayout(prompt);
  }

  // Detect star / center + surrounding
  if (lower.includes('star') || lower.includes('center') || lower.includes('surround')) {
    return starLayout(prompt);
  }

  // Detect grid
  if (lower.includes('grid') || /\d+\s*[x×]\s*\d+/.test(lower)) {
    return gridLayout(prompt);
  }

  // Detect row / line / horizontal
  if (lower.includes('row') || lower.includes('line') || lower.includes('horizontal')) {
    return rowLayout(prompt);
  }

  // Default
  return defaultLayout(prompt);
}
