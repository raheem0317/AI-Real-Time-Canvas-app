import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ShapeNode } from '../types/index.js';
import { generateShapesFallback } from '../utils/fallback.js';
import { v4Fallback } from '../utils/helpers.js';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7',
  '#14b8a6', '#ef4444',
];

const SYSTEM_PROMPT = `You are a canvas shape generator AI. The user will describe a layout of shapes they want on a canvas.

You MUST respond with ONLY valid JSON — no markdown, no explanation, no code blocks.

Canvas size: 900 x 550 pixels.

Rules:
- Only "circle" and "rectangle" types allowed
- Maximum 12 shapes total
- Labels must be max 2 characters
- Keep all shapes inside the canvas bounds (x: 30-870, y: 30-520)
- For circles: include radius (15-40)
- For rectangles: include width (40-120) and height (30-80)
- Pick vibrant, distinct colors for each shape

Respond with this exact JSON structure:
{
  "nodes": [
    {
      "type": "circle",
      "x": 400,
      "y": 200,
      "radius": 30,
      "label": "A",
      "color": "#6366f1"
    },
    {
      "type": "rectangle",
      "x": 300,
      "y": 350,
      "width": 80,
      "height": 50,
      "label": "B",
      "color": "#ec4899"
    }
  ]
}`;

let model: GenerativeModel | null = null;

/**
 * Initialize the Gemini model if API key is available
 */
function getModel(): GenerativeModel | null {
  if (model) return model;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.log('⚠️  No Gemini API key found. Using structured fallback logic.');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('✅ Gemini AI model initialized successfully.');
    return model;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini model:', error);
    return null;
  }
}

/**
 * Validate and sanitize AI-generated nodes
 */
function validateNodes(raw: any[]): ShapeNode[] {
  const nodes: ShapeNode[] = [];

  for (let i = 0; i < Math.min(raw.length, 12); i++) {
    const node = raw[i];
    if (!node || typeof node !== 'object') continue;

    const type = node.type === 'rectangle' ? 'rectangle' : 'circle';
    const x = clamp(Number(node.x) || 450, 30, 870);
    const y = clamp(Number(node.y) || 275, 30, 520);
    const label = String(node.label || String.fromCharCode(65 + i)).slice(0, 2);
    const color = typeof node.color === 'string' && node.color.startsWith('#')
      ? node.color
      : COLORS[i % COLORS.length];

    const shape: ShapeNode = {
      id: v4Fallback(),
      type,
      x,
      y,
      label,
      color,
    };

    if (type === 'circle') {
      shape.radius = clamp(Number(node.radius) || 30, 15, 40);
    } else {
      shape.width = clamp(Number(node.width) || 80, 40, 120);
      shape.height = clamp(Number(node.height) || 50, 30, 80);
    }

    nodes.push(shape);
  }

  return nodes;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Main function: Generate shapes from a prompt
 * Uses Gemini AI if available, falls back to structured logic
 */
export async function generateShapes(prompt: string): Promise<ShapeNode[]> {
  const aiModel = getModel();

  if (!aiModel) {
    console.log('🔄 Using fallback logic for prompt:', prompt);
    return generateShapesFallback(prompt);
  }

  try {
    console.log('🤖 Sending prompt to Gemini AI:', prompt);

    const result = await aiModel.generateContent([
      { text: SYSTEM_PROMPT },
      { text: `User prompt: "${prompt}"` },
    ]);

    const response = result.response;
    let text = response.text().trim();

    // Strip markdown code fences if present
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(text);

    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      throw new Error('Invalid AI response: missing nodes array');
    }

    const validated = validateNodes(parsed.nodes);

    if (validated.length === 0) {
      throw new Error('AI returned no valid shapes');
    }

    console.log(`✅ AI generated ${validated.length} shapes`);
    return validated;
  } catch (error) {
    console.error('❌ AI generation failed, using fallback:', error);
    return generateShapesFallback(prompt);
  }
}
