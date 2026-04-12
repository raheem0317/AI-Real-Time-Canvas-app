import React from 'react';
import { useCanvasStore } from '../store/canvasStore';

const Header: React.FC = () => {
  const connected = useCanvasStore((s) => s.connected);
  const nodes = useCanvasStore((s) => s.nodes);

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-logo">
          <span className="logo-icon">🎨</span>
          <h1 className="logo-text">AI Canvas</h1>
        </div>
        <span className="header-badge">Real-Time</span>
      </div>

      <div className="header-right">
        {nodes.length > 0 && (
          <span className="shape-count">
            {nodes.length} shape{nodes.length !== 1 ? 's' : ''}
          </span>
        )}
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot" />
          <span className="status-text">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
