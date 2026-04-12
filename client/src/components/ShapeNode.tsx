import React from 'react';
import { Circle, Rect, Text, Group } from 'react-konva';
import type { ShapeNode } from '../types';

interface ShapeNodeComponentProps {
  node: ShapeNode;
  onDragEnd: (id: string, x: number, y: number) => void;
}

const ShapeNodeComponent: React.FC<ShapeNodeComponentProps> = ({ node, onDragEnd }) => {
  const handleDragEnd = (e: any) => {
    const { x, y } = e.target.position();
    onDragEnd(node.id, x, y);
  };

  const handleMouseEnter = (e: any) => {
    const stage = e.target.getStage();
    if (stage) stage.container().style.cursor = 'grab';
  };

  const handleMouseLeave = (e: any) => {
    const stage = e.target.getStage();
    if (stage) stage.container().style.cursor = 'default';
  };

  const handleDragStart = (e: any) => {
    const stage = e.target.getStage();
    if (stage) stage.container().style.cursor = 'grabbing';
    // Bring to front
    e.target.moveToTop();
  };

  // Calculate text position relative to group origin (0,0)
  const getLabelPosition = () => {
    if (node.type === 'circle') {
      const r = node.radius || 30;
      return { x: -r, y: -8, width: r * 2 };
    } else {
      const w = node.width || 80;
      return { x: -w / 2, y: -8, width: w };
    }
  };

  const labelPos = getLabelPosition();

  // Slightly lighten color for the shadow / glow effect
  const shadowColor = node.color;

  return (
    <Group
      x={node.x}
      y={node.y}
      draggable
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {node.type === 'circle' ? (
        <Circle
          x={0}
          y={0}
          radius={node.radius || 30}
          fill={node.color}
          stroke={adjustBrightness(node.color, 40)}
          strokeWidth={2}
          shadowColor={shadowColor}
          shadowBlur={12}
          shadowOpacity={0.4}
          shadowOffsetY={4}
        />
      ) : (
        <Rect
          x={-(node.width || 80) / 2}
          y={-(node.height || 50) / 2}
          width={node.width || 80}
          height={node.height || 50}
          fill={node.color}
          stroke={adjustBrightness(node.color, 40)}
          strokeWidth={2}
          cornerRadius={8}
          shadowColor={shadowColor}
          shadowBlur={12}
          shadowOpacity={0.4}
          shadowOffsetY={4}
        />
      )}
      <Text
        x={labelPos.x}
        y={labelPos.y}
        width={labelPos.width}
        text={node.label}
        fontSize={16}
        fontFamily="Inter, sans-serif"
        fontStyle="bold"
        fill="#ffffff"
        align="center"
        listening={false}
      />
    </Group>
  );
};

/**
 * Utility to lighten a hex color by a fixed amount
 */
function adjustBrightness(hex: string, amount: number): string {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
    const b = Math.min(255, (num & 0x0000ff) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch {
    return hex;
  }
}

export default ShapeNodeComponent;
