import { io, Socket } from 'socket.io-client';
import { useCanvasStore } from '../store/canvasStore';
import type { GeneratedPayload, MovePayload, ErrorPayload, CanvasState } from '../types';

const SERVER_URL = 'http://localhost:3001';

class SocketService {
  private socket: Socket;
  private static instance: SocketService;

  private constructor() {
    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.setupListeners();
  }

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private setupListeners(): void {
    const store = useCanvasStore.getState;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Connected to server:', this.socket.id);
      useCanvasStore.setState({ connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      useCanvasStore.setState({ connected: false });
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message);
      useCanvasStore.setState({ connected: false });
    });

    // Canvas events
    this.socket.on('canvas:generated', (payload: GeneratedPayload) => {
      console.log(`📦 Received ${payload.nodes.length} shapes for prompt: "${payload.prompt}"`);
      useCanvasStore.setState({
        nodes: payload.nodes,
        loading: false,
        error: null,
        lastPrompt: payload.prompt,
      });
      // Persist to localStorage
      try {
        localStorage.setItem('ai-canvas-state', JSON.stringify(payload.nodes));
      } catch { /* ignore */ }
    });

    this.socket.on('canvas:state', (payload: CanvasState) => {
      console.log(`📦 Synced ${payload.nodes.length} shapes from server`);
      useCanvasStore.setState({ nodes: payload.nodes });
      try {
        localStorage.setItem('ai-canvas-state', JSON.stringify(payload.nodes));
      } catch { /* ignore */ }
    });

    this.socket.on('canvas:error', (payload: ErrorPayload) => {
      console.error('❌ Canvas error:', payload.message);
      useCanvasStore.setState({ error: payload.message, loading: false });
    });

    this.socket.on('canvas:cleared', () => {
      console.log('🗑️ Canvas cleared');
      useCanvasStore.setState({ nodes: [], lastPrompt: '' });
      try {
        localStorage.removeItem('ai-canvas-state');
      } catch { /* ignore */ }
    });

    // Node movement from other clients
    this.socket.on('node:moved', (payload: MovePayload) => {
      const { id, x, y } = payload;
      store().updateNodePosition(id, x, y);
    });
  }

  /** Send a prompt to generate shapes */
  generate(prompt: string): void {
    useCanvasStore.setState({ loading: true, error: null });
    this.socket.emit('canvas:generate', { prompt });
  }

  /** Notify server of a node position change */
  moveNode(id: string, x: number, y: number): void {
    this.socket.emit('node:move', { id, x, y });
  }

  /** Clear the canvas */
  clearCanvas(): void {
    this.socket.emit('canvas:clear');
  }

  /** Check if connected */
  isConnected(): boolean {
    return this.socket.connected;
  }
}

// Export singleton
export const socketService = SocketService.getInstance();
