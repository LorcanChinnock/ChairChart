import { getSeatPositions, snapToGrid } from "./seatGeometry";
import type { Table } from "../types";

export function runGeometryAssertions() {
  console.log("🧪 Running geometry assertions...");
  
  // Test round table with 4 seats
  const roundTable: Table = {
    id: "test-round",
    name: "Test Round",
    shape: "round",
    position: { x: 0, y: 0 },
    seatCount: 4,
    rotation: 0,
    size: { width: 100, height: 100 },
  };
  
  const roundSeats = getSeatPositions(roundTable);
  console.assert(roundSeats.length === 4, "Round table should have 4 seats");
  console.assert(roundSeats[0].seatNumber === 1, "First seat should be numbered 1");
  console.assert(roundSeats[3].seatNumber === 4, "Fourth seat should be numbered 4");
  
  // Verify seats are on circle with radius 80 (50 + 30 offset)
  roundSeats.forEach((seat, i) => {
    const distance = Math.sqrt(seat.position.x ** 2 + seat.position.y ** 2);
    console.assert(
      Math.abs(distance - 80) < 0.1, 
      `Round seat ${i + 1} should be at distance 80, got ${distance}`
    );
  });
  
  // Test rectangular table
  const rectTable: Table = {
    id: "test-rect",
    name: "Test Rect", 
    shape: "rect",
    position: { x: 0, y: 0 },
    seatCount: 8,
    rotation: 0,
    size: { width: 160, height: 100 },
  };
  
  const rectSeats = getSeatPositions(rectTable);
  console.assert(rectSeats.length === 8, "Rect table should have 8 seats");
  
  // Test edge case: 1 seat
  const singleSeatTable: Table = {
    ...roundTable,
    seatCount: 1,
  };
  
  const singleSeat = getSeatPositions(singleSeatTable);
  console.assert(singleSeat.length === 1, "Single seat table should have 1 seat");
  console.assert(singleSeat[0].seatNumber === 1, "Single seat should be numbered 1");
  
  // Test edge case: 20 seats (maximum)
  const maxSeatTable: Table = {
    ...roundTable,
    seatCount: 20,
  };
  
  const maxSeats = getSeatPositions(maxSeatTable);
  console.assert(maxSeats.length === 20, "Max seat table should have 20 seats");
  console.assert(maxSeats[19].seatNumber === 20, "Last seat should be numbered 20");
  
  // Test grid snapping
  const snapped = snapToGrid({ x: 17, y: 23 });
  console.assert(snapped.x === 20 && snapped.y === 20, "Grid snapping should work");
  
  // Test deterministic positioning for round tables of different sizes
  for (let seatCount = 1; seatCount <= 20; seatCount++) {
    const testTable: Table = { ...roundTable, seatCount };
    const seats = getSeatPositions(testTable);
    
    console.assert(seats.length === seatCount, `Table with ${seatCount} seats failed`);
    
    // Verify all seats have unique positions and sequential numbering
    const positions = new Set(seats.map(s => `${s.position.x},${s.position.y}`));
    console.assert(
      positions.size === seatCount, 
      `Seat positions should be unique for ${seatCount} seats`
    );
    
    seats.forEach((seat, i) => {
      console.assert(
        seat.seatNumber === i + 1, 
        `Seat ${i} should be numbered ${i + 1}, got ${seat.seatNumber}`
      );
    });
  }
  
  console.log("✅ All geometry assertions passed!");
}

// Only run in development
if (process.env.NODE_ENV === "development") {
  runGeometryAssertions();
}