import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { motion, AnimatePresence } from 'framer-motion';
import ShapeNodeComponent from './ShapeNode';
import { useCanvasStore } from '../store/canvasStore';
import { socketService } from '../socket/socket';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 550;

const Canvas: React.FC = () => {
  const nodes = useCanvasStore((s) => s.nodes);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;
        
        // Fit within viewport with padding
        const scaleX = (containerWidth * 0.85) / CANVAS_WIDTH;
        const scaleY = (containerHeight * 0.75) / CANVAS_HEIGHT;
        const newScale = Math.min(scaleX, scaleY, 1.2); // Don't scale up too much
        
        setScale(newScale);
        setContainerSize({
          width: CANVAS_WIDTH * newScale,
          height: CANVAS_HEIGHT * newScale,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragEnd = (id: string, x: number, y: number) => {
    const clampedX = Math.max(30, Math.min(CANVAS_WIDTH - 30, x));
    const clampedY = Math.max(30, Math.min(CANVAS_HEIGHT - 30, y));
    useCanvasStore.getState().updateNodePosition(id, clampedX, clampedY);
    socketService.moveNode(id, clampedX, clampedY);
  };

  return (
    <div className="canvas-container-inner" ref={containerRef}>
      <motion.div 
        className="canvas-frame" 
        style={{ width: containerSize.width, height: containerSize.height }}
        layout
      >
        <div className="canvas-pattern" />
        
        <Stage
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          scaleX={scale}
          scaleY={scale}
          style={{ width: containerSize.width, height: containerSize.height }}
        >
          <Layer>
            {nodes.map((node) => (
              <ShapeNodeComponent
                key={node.id}
                node={node}
                onDragEnd={handleDragEnd}
              />
            ))}
          </Layer>
        </Stage>

        <AnimatePresence>
          {nodes.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="canvas-empty"
            >
              <div className="canvas-empty-icon" style={{ filter: 'drop-shadow(0 0 10px var(--primary-glow))' }}>✨</div>
              <p className="canvas-empty-text">The canvas is yours.</p>
              <p className="canvas-empty-hint">
                Use the command bar below to generate your layout with AI.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Canvas;
