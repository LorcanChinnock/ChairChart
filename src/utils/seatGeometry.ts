import type { Table, SeatPosition, Vec2 } from "../types";

export function getSeatPositions(table: Table): SeatPosition[] {
  const { shape, seatCount, size, rotation = 0, seatConfig } = table;
  
  switch (shape) {
    case "round":
      return getRoundTableSeatPositions(seatCount, size.width / 2, rotation);
    case "rect":
      return getRectTableSeatPositions(seatCount, size, rotation, seatConfig?.cornerSeats);
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

function getRectTableSeatPositions(seatCount: number, size: { width: number; height: number }, rotation: number, cornerSeats: number = 2): SeatPosition[] {
  const positions: SeatPosition[] = [];
  const { width, height } = size;
  const offset = 30; // Distance from table edge
  
  // For small counts or when no corner configuration, use old perimeter logic
  if (seatCount <= 4 || cornerSeats === undefined) {
    return distributeSeatsAroundPerimeter(seatCount, size, rotation);
  }
  
  // For rectangles with corner priority
  const actualCornerSeats = Math.min(cornerSeats, seatCount, 4);
  const remainingSeats = seatCount - actualCornerSeats;
  
  let seatNumber = 1;
  
  // Determine orientation
  const isHorizontal = width >= height;
  
  if (isHorizontal) {
    // Horizontal rectangle: prioritize left and right ends
    
    // Place corner seats on the ends (left and right)
    if (actualCornerSeats >= 1) {
      const rightPos = rotatePoint({ x: width / 2 + offset, y: 0 }, rotation);
      positions.push({
        position: rightPos,
        angle: Math.PI + (rotation * Math.PI / 180),
        seatNumber: seatNumber++,
      });
    }
    if (actualCornerSeats >= 2) {
      const leftPos = rotatePoint({ x: -width / 2 - offset, y: 0 }, rotation);
      positions.push({
        position: leftPos,
        angle: 0 + (rotation * Math.PI / 180),
        seatNumber: seatNumber++,
      });
    }
    
    // Additional corner seats on top-right and top-left if needed
    if (actualCornerSeats >= 3) {
      const topRightPos = rotatePoint({ x: width / 2, y: -height / 2 - offset }, rotation);
      positions.push({
        position: topRightPos,
        angle: Math.PI / 2 + (rotation * Math.PI / 180),
        seatNumber: seatNumber++,
      });
    }
    if (actualCornerSeats >= 4) {
      const topLeftPos = rotatePoint({ x: -width / 2, y: -height / 2 - offset }, rotation);
      positions.push({
        position: topLeftPos,
        angle: Math.PI / 2 + (rotation * Math.PI / 180),
        seatNumber: seatNumber++,
      });
    }
    
    // Distribute remaining seats on top and bottom edges
    const topSeats = Math.ceil(remainingSeats / 2);
    const bottomSeats = remainingSeats - topSeats;
    
    // Top edge (avoiding corners if they're taken)
    const topStartX = actualCornerSeats >= 4 ? -width / 2 + width / topSeats : -width / 2;
    const topEndX = actualCornerSeats >= 3 ? width / 2 - width / topSeats : width / 2;
    
    for (let i = 0; i < topSeats; i++) {
      const t = topSeats === 1 ? 0.5 : i / (topSeats - 1);
      const x = topStartX + (topEndX - topStartX) * t;
      const pos = rotatePoint({ x, y: -height / 2 - offset }, rotation);
      positions.push({
        position: pos,
        angle: Math.PI / 2 + (rotation * Math.PI / 180),
        seatNumber: seatNumber++,
      });
    }
    
    // Bottom edge
    for (let i = 0; i < bottomSeats; i++) {
      const t = bottomSeats === 1 ? 0.5 : i / (bottomSeats - 1);
      const x = width / 2 - width * t;
      const pos = rotatePoint({ x, y: height / 2 + offset }, rotation);
      positions.push({
        position: pos,
        angle: -Math.PI / 2 + (rotation * Math.PI / 180),
        seatNumber: seatNumber++,
      });
    }
    
  } else {
    // Vertical rectangle: prioritize top and bottom ends
    
    // Place corner seats on the ends (top and bottom)
    if (actualCornerSeats >= 1) {
      const topPos = rotatePoint({ x: 0, y: -height / 2 - offset }, rotation);
      positions.push({
        position: topPos,
        angle: Math.PI / 2 + (rotation * Math.PI / 180),
        seatNumber: seatNumber++,
      });
    }
    if (actualCornerSeats >= 2) {
      const bottomPos = rotatePoint({ x: 0, y: height / 2 + offset }, rotation);
      positions.push({
        position: bottomPos,
        angle: -Math.PI / 2 + (rotation * Math.PI / 180),
        seatNumber: seatNumber++,
      });
    }
    
    // Additional corner seats on left and right if needed
    if (actualCornerSeats >= 3) {
      const leftPos = rotatePoint({ x: -width / 2 - offset, y: 0 }, rotation);
      positions.push({
        position: leftPos,
        angle: 0 + (rotation * Math.PI / 180),
        seatNumber: seatNumber++,
      });
    }
    if (actualCornerSeats >= 4) {
      const rightPos = rotatePoint({ x: width / 2 + offset, y: 0 }, rotation);
      positions.push({
        position: rightPos,
        angle: Math.PI + (rotation * Math.PI / 180),
        seatNumber: seatNumber++,
      });
    }
    
    // Distribute remaining seats on left and right edges
    const leftSeats = Math.ceil(remainingSeats / 2);
    const rightSeats = remainingSeats - leftSeats;
    
    // Left edge
    for (let i = 0; i < leftSeats; i++) {
      const t = leftSeats === 1 ? 0.5 : i / (leftSeats - 1);
      const y = height / 2 - height * t;
      const pos = rotatePoint({ x: -width / 2 - offset, y }, rotation);
      positions.push({
        position: pos,
        angle: 0 + (rotation * Math.PI / 180),
        seatNumber: seatNumber++,
      });
    }
    
    // Right edge
    for (let i = 0; i < rightSeats; i++) {
      const t = rightSeats === 1 ? 0.5 : i / (rightSeats - 1);
      const y = -height / 2 + height * t;
      const pos = rotatePoint({ x: width / 2 + offset, y }, rotation);
      positions.push({
        position: pos,
        angle: Math.PI + (rotation * Math.PI / 180),
        seatNumber: seatNumber++,
      });
    }
  }
  
  return positions;
}

function getSquareTableSeatPositions(seatCount: number, size: number, rotation: number): SeatPosition[] {
  const positions: SeatPosition[] = [];
  const offset = 30; // Distance from table edge
  const halfSize = size / 2;
  
  // For squares, distribute evenly across each side
  const seatsPerSide = Math.floor(seatCount / 4);
  const remainingSeats = seatCount % 4;
  
  let seatNumber = 1;
  
  // Define the four sides with their seat counts
  const sides = [
    { seats: seatsPerSide + (remainingSeats > 0 ? 1 : 0), startX: -halfSize, startY: -halfSize - offset, endX: halfSize, endY: -halfSize - offset, angle: Math.PI / 2 }, // Top
    { seats: seatsPerSide + (remainingSeats > 1 ? 1 : 0), startX: halfSize + offset, startY: -halfSize, endX: halfSize + offset, endY: halfSize, angle: Math.PI }, // Right  
    { seats: seatsPerSide + (remainingSeats > 2 ? 1 : 0), startX: halfSize, startY: halfSize + offset, endX: -halfSize, endY: halfSize + offset, angle: -Math.PI / 2 }, // Bottom
    { seats: seatsPerSide, startX: -halfSize - offset, startY: halfSize, endX: -halfSize - offset, endY: -halfSize, angle: 0 }, // Left
  ];
  
  for (const side of sides) {
    for (let i = 0; i < side.seats; i++) {
      const t = side.seats === 1 ? 0.5 : i / (side.seats - 1);
      const x = side.startX + (side.endX - side.startX) * t;
      const y = side.startY + (side.endY - side.startY) * t;
      
      const rotatedPos = rotatePoint({ x, y }, rotation);
      positions.push({
        position: rotatedPos,
        angle: side.angle + (rotation * Math.PI / 180),
        seatNumber: seatNumber++,
      });
    }
  }
  
  return positions;
}

// Helper function for small seat counts on rectangles  
function distributeSeatsAroundPerimeter(seatCount: number, size: { width: number; height: number }, rotation: number): SeatPosition[] {
  const positions: SeatPosition[] = [];
  const { width, height } = size;
  const perimeter = 2 * (width + height);
  const seatSpacing = perimeter / seatCount;
  const offset = 30;
  
  for (let i = 0; i < seatCount; i++) {
    const distance = i * seatSpacing;
    let x: number, y: number, angle: number;
    
    if (distance <= width) {
      // Top edge
      x = distance - width / 2;
      y = -height / 2 - offset;
      angle = Math.PI / 2;
    } else if (distance <= width + height) {
      // Right edge
      x = width / 2 + offset;
      y = (distance - width) - height / 2;
      angle = Math.PI;
    } else if (distance <= 2 * width + height) {
      // Bottom edge
      x = width / 2 - (distance - width - height);
      y = height / 2 + offset;
      angle = -Math.PI / 2;
    } else {
      // Left edge
      x = -width / 2 - offset;
      y = height / 2 - (distance - 2 * width - height);
      angle = 0;
    }
    
    const rotatedPos = rotatePoint({ x, y }, rotation);
    positions.push({
      position: rotatedPos,
      angle: angle + (rotation * Math.PI / 180),
      seatNumber: i + 1,
    });
  }
  
  return positions;
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