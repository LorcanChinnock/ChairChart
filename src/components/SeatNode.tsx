"use client";

import React from "react";
import { Circle, Text, Group } from "react-konva";
import type { SeatPosition } from "../types";

interface SeatNodeProps {
  seat: SeatPosition;
  tablePosition: { x: number; y: number };
  isSelected?: boolean;
  scale?: number;
}

export default function SeatNode({
  seat,
  tablePosition,
  isSelected = false,
  scale = 1
}: SeatNodeProps) {
  const seatRadius = Math.max(12 / scale, 8); // Responsive seat size, minimum 8px
  const fontSize = Math.max(12 / scale, 8); // Responsive font size
  
  // Calculate absolute position by adding table position to relative seat position
  const absoluteX = tablePosition.x + seat.position.x;
  const absoluteY = tablePosition.y + seat.position.y;
  
  // Colors based on selection state
  const fillColor = isSelected ? "#3b82f6" : "#f3f4f6";
  const strokeColor = isSelected ? "#1e40af" : "#9ca3af";
  const textColor = isSelected ? "#ffffff" : "#374151";
  
  return (
    <Group
      x={absoluteX}
      y={absoluteY}
      rotation={(seat.angle * 180) / Math.PI}
    >
      {/* Seat circle */}
      <Circle
        x={0}
        y={0}
        radius={seatRadius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1 / scale}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={2 / scale}
        shadowOpacity={0.3}
      />
      
      {/* Seat number */}
      <Text
        x={0}
        y={0}
        text={seat.seatNumber.toString()}
        fontSize={fontSize}
        fill={textColor}
        fontFamily="Inter, -apple-system, sans-serif"
        fontStyle="500"
        align="center"
        verticalAlign="middle"
        offsetX={0}
        offsetY={fontSize / 2}
        listening={false} // Text doesn't need to handle events
      />
    </Group>
  );
}