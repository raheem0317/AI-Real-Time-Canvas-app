import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { generateShapes } from './ai/generateShapes.js';
import type { ShapeNode, GeneratePayload, MovePayload } from './types/index.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

// ─── Express Setup ───────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

// ─── Socket.io Setup ─────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
});

// ─── In-Memory Canvas State ─────────────────────────────────────
let canvasState: ShapeNode[] = [];

// ─── Health Check ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    connectedClients: io.engine.clientsCount,
    shapesOnCanvas: canvasState.length,
  });
});

// ─── Socket Event Handlers ───────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Send current canvas state to newly connected client
  if (canvasState.length > 0) {
    socket.emit('canvas:state', { nodes: canvasState });
    console.log(`📤 Sent ${canvasState.length} shapes to ${socket.id}`);
  }

  // ─── canvas:generate ─────────────────────────────────────────
  socket.on('canvas:generate', async (payload: GeneratePayload) => {
    const { prompt } = payload;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      socket.emit('canvas:error', { message: 'Please enter a valid prompt.' });
      return;
    }

    console.log(`\n📝 Prompt from ${socket.id}: "${prompt}"`);

    try {
      const nodes = await generateShapes(prompt.trim());

      // Update server state
      canvasState = nodes;

      // Broadcast to ALL connected clients (including sender)
      io.emit('canvas:generated', { nodes, prompt: prompt.trim() });

      console.log(`✅ Generated ${nodes.length} shapes, broadcast to all clients`);
    } catch (error) {
      console.error('❌ Generation error:', error);
      socket.emit('canvas:error', {
        message: 'Failed to generate shapes. Please try again.',
      });
    }
  });

  // ─── node:move ────────────────────────────────────────────────
  socket.on('node:move', (payload: MovePayload) => {
    const { id, x, y } = payload;

    if (!id || typeof x !== 'number' || typeof y !== 'number') {
      return;
    }

    // Update server state
    const node = canvasState.find((n) => n.id === id);
    if (node) {
      node.x = x;
      node.y = y;
    }

    // Broadcast to all OTHER clients
    socket.broadcast.emit('node:moved', { id, x, y });
  });

  // ─── canvas:clear ─────────────────────────────────────────────
  socket.on('canvas:clear', () => {
    canvasState = [];
    io.emit('canvas:cleared');
    console.log('🗑️  Canvas cleared');
  });

  // ─── Disconnect ───────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ─── Start Server ────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   🎨 AI Real-Time Canvas Server             ║
║   Running on http://localhost:${PORT}           ║
║   WebSocket ready                            ║
╚══════════════════════════════════════════════╝
  `);
});
