import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socketService } from '../socket/socket';
import { useCanvasStore } from '../store/canvasStore';
import { Sparkles, Send, Trash2, Command, CornerDownLeft } from 'lucide-react';

const SAMPLE_PROMPTS = [
  'All Alphabets (A-Z)',
  'Star layout with 7 nodes',
  '3x4 grid of circles',
  '4 rectangles in a row',
];

const PromptInput: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [focused, setFocused] = useState(false);
  const loading = useCanvasStore((s) => s.loading);
  const error = useCanvasStore((s) => s.error);
  const nodes = useCanvasStore((s) => s.nodes);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    socketService.generate(prompt.trim());
  };

  const handleSampleClick = (sample: string) => {
    setPrompt(sample);
    socketService.generate(sample);
  };

  const handleClear = () => {
    socketService.clearCanvas();
    setPrompt('');
  };

  return (
    <div className="command-container">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", damping: 20 }}
        className="command-bar"
        style={{ 
          borderColor: focused ? 'var(--primary)' : 'var(--border-light)',
          boxShadow: focused ? '0 0 40px rgba(99, 102, 241, 0.2)' : '0 20px 40px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div className="command-input-group">
          <Sparkles size={18} className={loading ? 'loader' : 'text-dim'} color={loading ? 'white' : 'var(--primary)'} />
          <input
            ref={inputRef}
            className="command-input"
            placeholder="Describe what you want to create... (Ctrl+K)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', paddingRight: '0.25rem' }}>
          {nodes.length > 0 && (
            <button className="clear-trigger" onClick={handleClear} title="Clear Canvas">
              <Trash2 size={18} />
            </button>
          )}
          <button 
            className="gen-button" 
            onClick={handleSubmit}
            disabled={!prompt.trim() || loading}
          >
            {loading ? <div className="loader" /> : (
              <>
                <Send size={16} />
                Generate
              </>
            )}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {!loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="suggestions-row"
          >
            {SAMPLE_PROMPTS.map((sample, i) => (
              <button
                key={i}
                className="chip"
                onClick={() => handleSampleClick(sample)}
              >
                {sample}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="prompt-error"
          style={{ marginTop: '1rem', justifyContent: 'center' }}
        >
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default PromptInput;
