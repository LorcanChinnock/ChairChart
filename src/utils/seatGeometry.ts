import type { Table, SeatPosition, Vec2 } from "../types";

export function getSeatPositions(table: Table): SeatPosition[] {
  const { shape, seatCount, size, rotation = 0 } = table;
  
  switch (shape) {
    case "round":
      return getRoundTableSeatPositions(seatCount, size.width / 2, rotation);
    case "rect":
      return getRectTableSeatPositions(seatCount, size, rotation);
    case "square":
      return getSquareTableSeatPositions(seatCount, size.width, rotation);
    default:
      throw new Error(`Unsupported table shape: ${shape}`);
  }
}

function getRoundTableSeatPositions(seatCount: number, radius: number, rotation: number): SeatPosition[] {
  const positions: SeatPosition[] = [];
  const angleStep = (2 * Math.PI) / seatCount;
  const seatRadius = radius + 30; // 30px offset from table edge
  
  for (let i = 0; i < seatCount; i++) {
    const angle = i * angleStep + (rotation * Math.PI / 180);
    const x = Math.cos(angle) * seatRadius;
    const y = Math.sin(angle) * seatRadius;
    
    positions.push({
      position: { x, y },
      angle: angle + Math.PI / 2, // Face toward center
      seatNumber: i + 1,
    });
  }
  
  return positions;
}

function getRectTableSeatPositions(seatCount: number, size: { width: number; height: number }, rotation: number): SeatPosition[] {
  const positions: SeatPosition[] = [];
  const { width, height } = size;
  const perimeter = 2 * (width + height);
  const seatSpacing = perimeter / seatCount;
  const offset = 30; // Distance from table edge
  
  for (let i = 0; i < seatCount; i++) {
    const distance = i * seatSpacing;
    let x: number, y: number, angle: number;
    
    if (distance <= width) {
      // Top edge
      x = distance - width / 2;
      y = -height / 2 - offset;
      angle = Math.PI / 2; // Face down
    } else if (distance <= width + height) {
      // Right edge
      x = width / 2 + offset;
      y = (distance - width) - height / 2;
      angle = Math.PI; // Face left
    } else if (distance <= 2 * width + height) {
      // Bottom edge
      x = width / 2 - (distance - width - height);
      y = height / 2 + offset;
      angle = -Math.PI / 2; // Face up
    } else {
      // Left edge
      x = -width / 2 - offset;
      y = height / 2 - (distance - 2 * width - height);
      angle = 0; // Face right
    }
    
    // Apply rotation
    const rotatedPos = rotatePoint({ x, y }, rotation);
    
    positions.push({
      position: rotatedPos,
      angle: angle + (rotation * Math.PI / 180),
      seatNumber: i + 1,
    });
  }
  
  return positions;
}

function getSquareTableSeatPositions(seatCount: number, size: number, rotation: number): SeatPosition[] {
  return getRectTableSeatPositions(seatCount, { width: size, height: size }, rotation);
}

function rotatePoint(point: Vec2, degrees: number): Vec2 {
  const radians = degrees * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

export function getTableBounds(table: Table): { min: Vec2; max: Vec2 } {
  const { position, size, rotation = 0 } = table;
  const halfWidth = size.width / 2;
  const halfHeight = size.height / 2;
  
  // Get all corner points
  const corners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ];
  
  // Rotate corners
  const rotatedCorners = corners.map(corner => rotatePoint(corner, rotation));
  
  // Find min/max after rotation
  const xs = rotatedCorners.map(p => p.x + position.x);
  const ys = rotatedCorners.map(p => p.y + position.y);
  
  return {
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
  };
}

export function snapToGrid(position: Vec2, gridSize: number = 20): Vec2 {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}