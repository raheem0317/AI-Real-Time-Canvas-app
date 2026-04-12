import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Canvas from './components/Canvas';
import PromptInput from './components/PromptInput';
import { MousePointer2, Layout, Square, Circle as CircleIcon, Trash2, Settings } from 'lucide-react';
import './App.css';

// Import socket to ensure it connects on app load
import './socket/socket';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <div className="mesh-bg" />
      
      <Header />
      
      {/* Side Toolbar */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        className="side-toolbar"
      >
        <button className="tool-item active" title="Select">
          <MousePointer2 size={20} />
        </button>
        <button className="tool-item" title="Shapes">
          <Layout size={20} />
        </button>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />
        <button className="tool-item" title="Settings">
          <Settings size={20} />
        </button>
      </motion.div>

      <main className="canvas-viewport">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Canvas />
        </motion.div>
      </main>

      <PromptInput />
    </div>
  );
};

export default App;
