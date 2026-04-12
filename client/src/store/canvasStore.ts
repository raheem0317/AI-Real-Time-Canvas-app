import { create } from 'zustand';
import type { ShapeNode } from '../types';

const STORAGE_KEY = 'ai-canvas-state';

interface CanvasStore {
  /** Current shapes on the canvas */
  nodes: ShapeNode[];
  /** Loading state while AI generates */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Whether socket is connected */
  connected: boolean;
  /** Last prompt used */
  lastPrompt: string;

  // Actions
  setNodes: (nodes: ShapeNode[]) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnected: (connected: boolean) => void;
  setLastPrompt: (prompt: string) => void;
  clearCanvas: () => void;
}

/**
 * Load persisted state from localStorage
 */
function loadPersistedState(): ShapeNode[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

/**
 * Persist canvas state to localStorage
 */
function persistState(nodes: ShapeNode[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  } catch {
    // Ignore storage errors
  }
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  nodes: loadPersistedState(),
  loading: false,
  error: null,
  connected: false,
  lastPrompt: '',

  setNodes: (nodes) => {
    persistState(nodes);
    set({ nodes, error: null });
  },

  updateNodePosition: (id, x, y) =>
    set((state) => {
      const updated = state.nodes.map((node) =>
        node.id === id ? { ...node, x, y } : node
      );
      persistState(updated);
      return { nodes: updated };
    }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  setConnected: (connected) => set({ connected }),

  setLastPrompt: (lastPrompt) => set({ lastPrompt }),

  clearCanvas: () => {
    persistState([]);
    set({ nodes: [], lastPrompt: '' });
  },
}));
