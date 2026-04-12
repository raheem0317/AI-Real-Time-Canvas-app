import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer } from 'react-konva';
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
        const newScale = Math.min(containerWidth / CANVAS_WIDTH, 1);
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
    // Clamp within canvas bounds
    const clampedX = Math.max(30, Math.min(CANVAS_WIDTH - 30, x));
    const clampedY = Math.max(30, Math.min(CANVAS_HEIGHT - 30, y));

    // Update local state
    useCanvasStore.getState().updateNodePosition(id, clampedX, clampedY);

    // Broadcast to other clients
    socketService.moveNode(id, clampedX, clampedY);
  };

  return (
    <div className="canvas-container" ref={containerRef}>
      <div className="canvas-wrapper" style={{ width: containerSize.width, height: containerSize.height }}>
        {/* Grid background rendered as CSS */}
        <div className="canvas-grid" />
        <Stage
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          scaleX={scale}
          scaleY={scale}
          style={{
            width: containerSize.width,
            height: containerSize.height,
          }}
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

        {nodes.length === 0 && (
          <div className="canvas-empty">
            <div className="canvas-empty-icon">✨</div>
            <p className="canvas-empty-text">Enter a prompt to generate shapes</p>
            <p className="canvas-empty-hint">
              Try: "Create a star layout with 1 center and 6 surrounding nodes"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
