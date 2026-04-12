import React, { useState, useRef, useEffect } from 'react';
import { socketService } from '../socket/socket';
import { useCanvasStore } from '../store/canvasStore';

const SAMPLE_PROMPTS = [
  'Create a star layout with 1 center node and 6 surrounding nodes',
  'Create a 3x4 grid of circles labeled A–L',
  'Create 4 rectangles in a row and 1 circle above center',
  'Create 5 circles in a star layout',
  'Create 3 rectangles and 3 circles in 2 rows',
];

const PromptInput: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const loading = useCanvasStore((s) => s.loading);
  const error = useCanvasStore((s) => s.error);
  const nodes = useCanvasStore((s) => s.nodes);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
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
    <div className="prompt-section">
      <form className="prompt-form" onSubmit={handleSubmit}>
        <div className="prompt-input-wrapper">
          <span className="prompt-icon">🤖</span>
          <input
            ref={inputRef}
            id="prompt-input"
            type="text"
            className="prompt-input"
            placeholder="Describe your canvas layout..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            maxLength={200}
            autoComplete="off"
          />
          <button
            id="generate-btn"
            type="submit"
            className={`prompt-btn ${loading ? 'loading' : ''}`}
            disabled={!prompt.trim() || loading}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              <>
                <span>Generate</span>
                <span className="btn-icon">→</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="prompt-error">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="prompt-actions">
        <div className="sample-prompts">
          {SAMPLE_PROMPTS.map((sample, i) => (
            <button
              key={i}
              className="sample-btn"
              onClick={() => handleSampleClick(sample)}
              disabled={loading}
              title={sample}
            >
              {sample.length > 45 ? sample.slice(0, 42) + '...' : sample}
            </button>
          ))}
        </div>
        {nodes.length > 0 && (
          <button className="clear-btn" onClick={handleClear} disabled={loading}>
            🗑️ Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default PromptInput;
