import { getSeatPositions, getTableBounds, snapToGrid } from "../seatGeometry";
import type { Table } from "../../types";

// Helper to create a test table
function createTable(overrides: Partial<Table> = {}): Table {
  return {
    id: "test-table",
    name: "Test Table",
    shape: "round",
    position: { x: 0, y: 0 },
    seatCount: 4,
    rotation: 0,
    size: { width: 100, height: 100 },
    ...overrides,
  };
}

describe("getSeatPositions", () => {
  describe("round tables", () => {
    test("4 seats on round table have deterministic positions", () => {
      const table = createTable({ shape: "round", seatCount: 4 });
      const seats = getSeatPositions(table);
      
      expect(seats).toHaveLength(4);
      
      // Verify deterministic positioning (seats should be at 90-degree intervals)
      expect(seats[0].position.x).toBeCloseTo(80, 1); // radius 50 + offset 30 = 80
      expect(seats[0].position.y).toBeCloseTo(0, 1);
      expect(seats[0].seatNumber).toBe(1);
      
      expect(seats[1].position.x).toBeCloseTo(0, 1);
      expect(seats[1].position.y).toBeCloseTo(80, 1);
      expect(seats[1].seatNumber).toBe(2);
      
      expect(seats[2].position.x).toBeCloseTo(-80, 1);
      expect(seats[2].position.y).toBeCloseTo(0, 1);
      expect(seats[2].seatNumber).toBe(3);
      
      expect(seats[3].position.x).toBeCloseTo(0, 1);
      expect(seats[3].position.y).toBeCloseTo(-80, 1);
      expect(seats[3].seatNumber).toBe(4);
    });
    
    test("8 seats on round table are evenly distributed", () => {
      const table = createTable({ shape: "round", seatCount: 8 });
      const seats = getSeatPositions(table);
      
      expect(seats).toHaveLength(8);
      
      // Check that seats are evenly spaced (45 degrees apart)
      for (let i = 0; i < seats.length; i++) {
        const expectedAngle = (i * Math.PI * 2) / 8;
        const actualAngle = Math.atan2(seats[i].position.y, seats[i].position.x);
        const normalizedActual = actualAngle < 0 ? actualAngle + 2 * Math.PI : actualAngle;
        const normalizedExpected = expectedAngle < 0 ? expectedAngle + 2 * Math.PI : expectedAngle;
        
        expect(normalizedActual).toBeCloseTo(normalizedExpected, 2);
      }
    });
  });
  
  describe("rectangular tables", () => {
    test("4 seats on rect table are positioned on perimeter", () => {
      const table = createTable({ 
        shape: "rect", 
        seatCount: 4, 
        size: { width: 120, height: 80 } 
      });
      const seats = getSeatPositions(table);
      
      expect(seats).toHaveLength(4);
      
      // First seat should be on top edge
      expect(seats[0].position.y).toBeCloseTo(-70, 1); // -40 - 30 offset
      expect(seats[0].seatNumber).toBe(1);
      
      // Seats should be numbered 1-4
      seats.forEach((seat, i) => {
        expect(seat.seatNumber).toBe(i + 1);
      });
    });
    
    test("12 seats on rect table distributes evenly around perimeter", () => {
      const table = createTable({ 
        shape: "rect", 
        seatCount: 12, 
        size: { width: 200, height: 100 } 
      });
      const seats = getSeatPositions(table);
      
      expect(seats).toHaveLength(12);
      
      // Check that all seats are roughly at 30px offset from table edges
      seats.forEach(seat => {
        const { x, y } = seat.position;
        const halfWidth = 100; // width/2
        const halfHeight = 50; // height/2
        const offset = 30;
        
        // Check if seat is outside the table bounds by roughly the offset amount
        const isOutsideLeft = x < -(halfWidth + offset - 10);
        const isOutsideRight = x > (halfWidth + offset - 10);
        const isOutsideTop = y < -(halfHeight + offset - 10);
        const isOutsideBottom = y > (halfHeight + offset - 10);
        
        // At least one of these should be true (seat should be outside table bounds)
        expect(isOutsideLeft || isOutsideRight || isOutsideTop || isOutsideBottom).toBe(true);
      });
    });
  });
  
  describe("square tables", () => {
    test("8 seats on square table distributes evenly across sides", () => {
      const table = createTable({ 
        shape: "square", 
        seatCount: 8, 
        size: { width: 100, height: 100 } 
      });
      const seats = getSeatPositions(table);
      
      expect(seats).toHaveLength(8);
      
      // Should have 2 seats per side (8/4 = 2)
      seats.forEach((seat, i) => {
        expect(seat.seatNumber).toBe(i + 1);
        // Check that seat is at proper offset from table edges
        const { x, y } = seat.position;
        const minDistance = Math.min(
          Math.abs(Math.abs(x) - 80), // 50 + 30 offset
          Math.abs(Math.abs(y) - 80)
        );
        expect(minDistance).toBeLessThan(1); // Should be close to table edge + offset
      });
    });
    
    test("6 seats on square table distributes with remainder", () => {
      const table = createTable({ 
        shape: "square", 
        seatCount: 6, 
        size: { width: 100, height: 100 } 
      });
      const seats = getSeatPositions(table);
      
      expect(seats).toHaveLength(6);
      
      // Should distribute: 2, 2, 1, 1 across the four sides
      seats.forEach((seat, i) => {
        expect(seat.seatNumber).toBe(i + 1);
      });
    });
  });
  
  describe("rectangular table corner configuration", () => {
    test("rectangle with corner seating configuration", () => {
      const table = createTable({ 
        shape: "rect", 
        seatCount: 8, 
        size: { width: 200, height: 100 },
        seatConfig: { cornerSeats: 2 }
      });
      const seats = getSeatPositions(table);
      
      expect(seats).toHaveLength(8);
      
      // Should prioritize corners/ends for horizontal rectangle
      seats.forEach((seat, i) => {
        expect(seat.seatNumber).toBe(i + 1);
      });
    });
    
    test("rectangle without seatConfig uses perimeter distribution", () => {
      const table = createTable({ 
        shape: "rect", 
        seatCount: 8, 
        size: { width: 200, height: 100 }
        // No seatConfig provided
      });
      const seats = getSeatPositions(table);
      
      expect(seats).toHaveLength(8);
      
      // Should use old perimeter-based distribution
      seats.forEach((seat, i) => {
        expect(seat.seatNumber).toBe(i + 1);
      });
    });
    
    test("rectangle with 0 corner seats uses perimeter distribution", () => {
      const table = createTable({ 
        shape: "rect", 
        seatCount: 8, 
        size: { width: 200, height: 100 },
        seatConfig: { cornerSeats: 0 }
      });
      const seats = getSeatPositions(table);
      
      expect(seats).toHaveLength(8);
      
      // Should still use improved distribution but with 0 corner priority
      seats.forEach((seat, i) => {
        expect(seat.seatNumber).toBe(i + 1);
      });
    });
  });
  
  describe("rotation", () => {
    test("rotated round table maintains seat count and relative positions", () => {
      const baseTable = createTable({ shape: "round", seatCount: 4, rotation: 0 });
      const rotatedTable = createTable({ shape: "round", seatCount: 4, rotation: 45 });
      
      const baseSeats = getSeatPositions(baseTable);
      const rotatedSeats = getSeatPositions(rotatedTable);
      
      expect(rotatedSeats).toHaveLength(4);
      
      // Check that rotation preserved the relative distances
      rotatedSeats.forEach((seat, i) => {
        const distance = Math.sqrt(seat.position.x ** 2 + seat.position.y ** 2);
        const baseDistance = Math.sqrt(baseSeats[i].position.x ** 2 + baseSeats[i].position.y ** 2);
        expect(distance).toBeCloseTo(baseDistance, 1);
      });
    });
  });
  
  describe("edge cases", () => {
    test("single seat on round table", () => {
      const table = createTable({ shape: "round", seatCount: 1 });
      const seats = getSeatPositions(table);
      
      expect(seats).toHaveLength(1);
      expect(seats[0].seatNumber).toBe(1);
      expect(seats[0].position.x).toBeCloseTo(80, 1);
      expect(seats[0].position.y).toBeCloseTo(0, 1);
    });
    
    test("maximum 20 seats on round table", () => {
      const table = createTable({ shape: "round", seatCount: 20 });
      const seats = getSeatPositions(table);
      
      expect(seats).toHaveLength(20);
      seats.forEach((seat, i) => {
        expect(seat.seatNumber).toBe(i + 1);
      });
    });
  });
});

describe("getTableBounds", () => {
  test("round table bounds", () => {
    const table = createTable({ 
      shape: "round", 
      position: { x: 100, y: 50 },
      size: { width: 80, height: 80 }
    });
    
    const bounds = getTableBounds(table);
    
    expect(bounds.min.x).toBeCloseTo(60, 1); // 100 - 40
    expect(bounds.min.y).toBeCloseTo(10, 1); // 50 - 40
    expect(bounds.max.x).toBeCloseTo(140, 1); // 100 + 40
    expect(bounds.max.y).toBeCloseTo(90, 1); // 50 + 40
  });
  
  test("rotated rectangular table bounds", () => {
    const table = createTable({ 
      shape: "rect", 
      position: { x: 0, y: 0 },
      size: { width: 100, height: 60 },
      rotation: 45
    });
    
    const bounds = getTableBounds(table);
    
    // At 45 degrees, the bounds should be larger due to rotation
    const expectedSize = (100 + 60) / Math.sqrt(2); // roughly
    expect(Math.abs(bounds.max.x - bounds.min.x)).toBeGreaterThan(100);
    expect(Math.abs(bounds.max.y - bounds.min.y)).toBeGreaterThan(60);
  });
});

describe("snapToGrid", () => {
  test("snaps positions to 20px grid by default", () => {
    expect(snapToGrid({ x: 17, y: 23 })).toEqual({ x: 20, y: 20 });
    expect(snapToGrid({ x: 31, y: 8 })).toEqual({ x: 40, y: 0 });
    
    const result = snapToGrid({ x: -7, y: -13 });
    expect(Math.abs(result.x)).toBe(0); // Handle -0 vs 0
    expect(result.y).toBe(-20);
  });
  
  test("respects custom grid size", () => {
    expect(snapToGrid({ x: 17, y: 23 }, 10)).toEqual({ x: 20, y: 20 });
    expect(snapToGrid({ x: 17, y: 23 }, 5)).toEqual({ x: 15, y: 25 });
  });
});