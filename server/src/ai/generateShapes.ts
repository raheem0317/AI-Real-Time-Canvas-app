import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { ShapeNode } from '../types/index.js';
import { generateShapesFallback } from '../utils/fallback.js';
import { v4Fallback } from '../utils/helpers.js';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7',
  '#14b8a6', '#ef4444',
];

const SYSTEM_PROMPT = `You are a Senior Canvas Architect. Your goal is to generate perfectly balanced, geometric layouts for a 900x550 canvas.

COORDINATE GUIDE:
(30, 30)      [Top Left]      | (450, 30)   [Top Center]    | (870, 30)    [Top Right]
(30, 275)     [Mid Left]      | (450, 275)  [Center]        | (870, 275)   [Mid Right]
(30, 520)     [Bottom Left]   | (450, 520)  [Bottom Center] | (870, 520)   [Bottom Right]

CRITICAL RULES:
1. OUTPUT ONLY VALID JSON.
2. CANVAS BOUNDS: x(30-870), y(30-520).
3. NEVER CLUMP NODES: Maintain at least 100px between shape centers unless specified.
4. SYMMETRY: For stars/circles, ensure perfect radial symmetry using sin/cos.

TASK:
1. First, create a "reasoning" string explaining your spatial calculations.
2. Then, output the "nodes" array.

JSON STRUCTURE:
{
  "reasoning": "I will place a central circle at (450,275) and 6 surrounding nodes at 60-degree intervals with a radius of 200px...",
  "nodes": [
    {"type": "circle", "x": 450, "y": 275, "radius": 35, "label": "C", "color": "#6366f1"},
    ...
  ]
}

EXAMPLE: "5 nodes in a line"
{
  "reasoning": "Distributing 5 nodes horizontally at y=275. Spacing = (870-30)/4 = 210px.",
  "nodes": [
    {"type": "circle", "x": 30, "y": 275, "radius": 25, "label": "1", "color": "#6366f1"},
    {"type": "circle", "x": 240, "y": 275, "radius": 25, "label": "2", "color": "#8b5cf6"},
    {"type": "circle", "x": 450, "y": 275, "radius": 25, "label": "3", "color": "#ec4899"},
    {"type": "circle", "x": 660, "y": 275, "radius": 25, "label": "4", "color": "#f43f5e"},
    {"type": "circle", "x": 870, "y": 275, "radius": 25, "label": "5", "color": "#f97316"}
  ]
}
`;

// AI Clients
let geminiModel: GenerativeModel | null = null;
let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  if (groqClient) return groqClient;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes('your_api_key')) return null;

  try {
    groqClient = new Groq({ apiKey });
    console.log('✅ Groq AI initialized successfully.');
    return groqClient;
  } catch (error) {
    console.error('❌ Failed to initialize Groq:', error);
    return null;
  }
}

function getGeminiModel(): GenerativeModel | null {
  if (geminiModel) return geminiModel;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_api_key')) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('✅ Gemini AI initialized successfully.');
    return geminiModel;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini:', error);
    return null;
  }
}

/**
 * Validate and sanitize AI-generated nodes
 */
function validateNodes(raw: any[]): ShapeNode[] {
  const nodes: ShapeNode[] = [];

  for (let i = 0; i < Math.min(raw.length, 26); i++) {
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
 * Uses Groq (primary), Gemini (secondary), or Fallback
 */
export async function generateShapes(prompt: string): Promise<ShapeNode[]> {
  const activeGroq = getGroqClient();
  const activeGemini = getGeminiModel();

  try {
    let jsonText = '';

    if (activeGroq) {
      console.log('🤖 Sending prompt to Groq AI:', prompt);
      const completion = await activeGroq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `User prompt: "${prompt}"` },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });
      jsonText = completion.choices[0]?.message?.content || '';
    } 
    else if (activeGemini) {
      console.log('🤖 Sending prompt to Gemini AI:', prompt);
      const result = await activeGemini.generateContent([
        { text: SYSTEM_PROMPT },
        { text: `User prompt: "${prompt}"` },
      ]);
      jsonText = result.response.text();
    } 
    else {
      console.log('🔄 No AI key found. Using fallback logic for:', prompt);
      return generateShapesFallback(prompt);
    }

    // Clean up response
    let text = jsonText.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(text);
    if (parsed.reasoning) {
      console.log('🧠 AI Reasoning:', parsed.reasoning);
    }
    
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      throw new Error('Invalid AI response format');
    }

    const validated = validateNodes(parsed.nodes);
    if (validated.length === 0) throw new Error('No valid nodes generated');

    console.log(`✅ AI generated ${validated.length} shapes`);
    return validated;

  } catch (error) {
    console.error('❌ AI generation failed, using fallback:', error);
    return generateShapesFallback(prompt);
  }
}

