"use client";

import React, { useRef, useMemo } from "react";
import { Group, Circle, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { Table } from "../types";
import { getSeatPositions } from "../utils/seatGeometry";
import { snapPoint } from "../utils/canvasTransforms";
import SeatNode from "./SeatNode";

interface TableNodeProps {
  table: Table;
  isSelected?: boolean;
  scale?: number;
  isDragging?: boolean;
  onSelect?: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: (id: string, position: { x: number; y: number }) => void;
}

export default function TableNode({
  table,
  isSelected = false,
  scale = 1,
  isDragging = false,
  onSelect,
  onDragStart,
  onDragEnd
}: TableNodeProps) {
  const groupRef = useRef<Konva.Group>(null);
  
  // Memoize seat positions to prevent recalculation during drag
  const seatPositions = useMemo(() => getSeatPositions(table), [table.shape, table.seatCount, table.size, table.rotation]);
  
  // Table styling based on selection
  const fillColor = isSelected ? "#fef3c7" : "#ffffff";
  const strokeColor = isSelected ? "#f59e0b" : "#d1d5db";
  const strokeWidth = (isSelected ? 2 : 1) / scale;
  
  // Text styling
  const fontSize = Math.max(14 / scale, 10);
  const textColor = "#374151";
  
  // Handle table selection
  const handleClick = () => {
    if (onSelect) {
      onSelect(table.id);
    }
  };
  
  // Handle drag start
  const handleDragStart = () => {
    if (onDragStart) {
      onDragStart(table.id);
    }
  };
  
  // Handle drag end with grid snapping
  const handleDragEnd = () => {
    const group = groupRef.current;
    if (group && onDragEnd) {
      const newPosition = snapPoint({ x: group.x(), y: group.y() });
      group.position(newPosition);
      onDragEnd(table.id, newPosition);
    }
  };
  
  // Render table shape
  const renderTableShape = () => {
    switch (table.shape) {
      case "round":
        return (
          <Circle
            x={0}
            y={0}
            radius={table.size.width / 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            shadowColor="rgba(0, 0, 0, 0.1)"
            shadowBlur={4 / scale}
            shadowOpacity={0.3}
          />
        );
      
      case "rect":
      case "square":
        return (
          <Rect
            x={-table.size.width / 2}
            y={-table.size.height / 2}
            width={table.size.width}
            height={table.size.height}
            cornerRadius={8 / scale}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            shadowColor="rgba(0, 0, 0, 0.1)"
            shadowBlur={4 / scale}
            shadowOpacity={0.3}
          />
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Group
      ref={groupRef}
      x={table.position.x}
      y={table.position.y}
      rotation={table.rotation}
      draggable
      onClick={handleClick}
      onTap={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Table shape */}
      {renderTableShape()}
      
      {/* Table name */}
      <Text
        x={0}
        y={0}
        text={table.name}
        fontSize={fontSize}
        fill={textColor}
        fontFamily="Inter, -apple-system, sans-serif"
        fontStyle="600"
        align="center"
        verticalAlign="middle"
        offsetX={0}
        offsetY={fontSize / 2}
        listening={false} // Text doesn't need to handle drag events
      />
      
      {/* Seats - render outside the rotated table group for consistent positioning */}
      {/* Hide seats during drag for better performance */}
      {!isDragging && seatPositions.map((seat) => (
        <SeatNode
          key={`seat-${table.id}-${seat.seatNumber}`}
          seat={seat}
          tablePosition={{ x: 0, y: 0 }} // Relative to table group
          isSelected={isSelected}
          scale={scale}
        />
      ))}
    </Group>
  );
}