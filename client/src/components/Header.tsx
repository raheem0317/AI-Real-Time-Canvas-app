import React from 'react';
import { motion } from 'framer-motion';
import { useCanvasStore } from '../store/canvasStore';
import { Activity, Radio } from 'lucide-react';

const Header: React.FC = () => {
  const connected = useCanvasStore((s) => s.connected);
  const nodes = useCanvasStore((s) => s.nodes);

  return (
    <nav className="nav-bar">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="logo-container"
      >
        <div className="logo-vibe">
          <Activity size={18} color="white" strokeWidth={3} />
        </div>
        <h1 className="logo-text">AI Canvas <span style={{ fontWeight: 400, opacity: 0.5 }}>OS</span></h1>
      </motion.div>

      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="status-pills"
      >
        <div className="pill">
          <span className="text-muted">{nodes.length}</span> Objects
        </div>
        <div className={`pill ${connected ? 'active' : ''}`}>
          <Radio size={14} />
          {connected ? 'Live Sync' : 'Offline'}
          {connected && <span className="status-dot" />}
        </div>
      </motion.div>
    </nav>
  );
};

export default Header;
