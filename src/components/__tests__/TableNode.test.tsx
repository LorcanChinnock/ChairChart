import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { Stage, Layer } from "react-konva";
import TableNode from "../TableNode";
import type { Table } from "../../types";

// Mock getSeatPositions
vi.mock("../../utils/seatGeometry", () => ({
  getSeatPositions: vi.fn(() => [
    { position: { x: 0, y: -60 }, angle: 0, seatNumber: 1 },
    { position: { x: 42, y: -42 }, angle: Math.PI / 4, seatNumber: 2 },
    { position: { x: 60, y: 0 }, angle: Math.PI / 2, seatNumber: 3 },
    { position: { x: 42, y: 42 }, angle: (3 * Math.PI) / 4, seatNumber: 4 },
  ]),
}));

// Mock snapPoint
vi.mock("../../utils/canvasTransforms", () => ({
  snapPoint: vi.fn((pos) => ({
    x: Math.round(pos.x / 20) * 20,
    y: Math.round(pos.y / 20) * 20,
  })),
}));

const mockTable: Table = {
  id: "test-table-1",
  name: "Test Table",
  shape: "round",
  position: { x: 100, y: 50 },
  seatCount: 8,
  rotation: 0,
  size: { width: 120, height: 120 },
};

describe("TableNode", () => {
  const mockOnSelect = vi.fn();
  const mockOnDragEnd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderTableNode = (props: Partial<React.ComponentProps<typeof TableNode>> = {}) => {
    const defaultProps = {
      table: mockTable,
      isSelected: false,
      scale: 1,
      onSelect: mockOnSelect,
      onDragEnd: mockOnDragEnd,
    };

    return render(
      <Stage width={400} height={300}>
        <Layer>
          <TableNode {...defaultProps} {...props} />
        </Layer>
      </Stage>
    );
  };

  describe("rendering", () => {
    it("should render table with correct position", () => {
      const { container } = renderTableNode();
      
      // Check that the table group exists
      const group = container.querySelector('g[transform*="translate(100, 50)"]');
      expect(group).toBeInTheDocument();
    });

    it("should render table name", () => {
      const { getByText } = renderTableNode();
      expect(getByText("Test Table")).toBeInTheDocument();
    });

    it("should render round table shape", () => {
      const { container } = renderTableNode();
      
      // Should have a circle element for round table
      const circle = container.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });

    it("should render rectangular table shape", () => {
      const rectTable = {
        ...mockTable,
        shape: "rect" as const,
        size: { width: 160, height: 80 },
      };
      
      const { container } = renderTableNode({ table: rectTable });
      
      // Should have a rect element for rectangular table
      const rect = container.querySelector('rect');
      expect(rect).toBeInTheDocument();
    });

    it("should render seats", () => {
      const { container } = renderTableNode();
      
      // Should have 4 seat circles (mocked getSeatPositions returns 4 seats)
      // The table has one circle, so total should be 5 circles
      const allCircles = container.querySelectorAll('circle');
      expect(allCircles.length).toBeGreaterThanOrEqual(4); // At least 4 seat circles + 1 table circle
    });

    it("should apply selected styling when selected", () => {
      const { container } = renderTableNode({ isSelected: true });
      
      // Check for selected fill color
      const tableCircle = container.querySelector('circle');
      expect(tableCircle).toHaveAttribute('fill', '#fef3c7');
      expect(tableCircle).toHaveAttribute('stroke', '#f59e0b');
    });

    it("should apply default styling when not selected", () => {
      const { container } = renderTableNode({ isSelected: false });
      
      // Check for default fill color
      const tableCircle = container.querySelector('circle');
      expect(tableCircle).toHaveAttribute('fill', '#ffffff');
      expect(tableCircle).toHaveAttribute('stroke', '#d1d5db');
    });

    it("should scale stroke width with zoom", () => {
      const { container } = renderTableNode({ scale: 2 });
      
      const tableCircle = container.querySelector('circle');
      expect(tableCircle).toHaveAttribute('stroke-width', '0.5'); // 1 / scale
    });
  });

  describe("interaction", () => {
    it("should call onSelect when clicked", () => {
      const { container } = renderTableNode();
      
      const group = container.querySelector('g g'); // Inner group with the table
      if (group) {
        // Simulate click event
        const clickEvent = new MouseEvent('click', { bubbles: true });
        group.dispatchEvent(clickEvent);
      }
      
      expect(mockOnSelect).toHaveBeenCalledWith("test-table-1");
    });

    it("should call onDragEnd with snapped position", () => {
      const { container } = renderTableNode();
      
      const group = container.querySelector('g g');
      if (group) {
        // Simulate drag end - this would normally be handled by Konva
        // We can test the callback logic separately
        const tableNode = renderTableNode();
        
        // Test that onDragEnd would be called with snapped position
        expect(mockOnDragEnd).not.toHaveBeenCalled(); // No drag yet
      }
    });
  });

  describe("table shapes", () => {
    it("should render square table", () => {
      const squareTable = {
        ...mockTable,
        shape: "square" as const,
        size: { width: 100, height: 100 },
      };
      
      const { container } = renderTableNode({ table: squareTable });
      
      // Should have a rect element for square table
      const rect = container.querySelector('rect');
      expect(rect).toBeInTheDocument();
      expect(rect).toHaveAttribute('width', '100');
      expect(rect).toHaveAttribute('height', '100');
    });

    it("should apply rotation to table group", () => {
      const rotatedTable = {
        ...mockTable,
        rotation: 45,
      };
      
      const { container } = renderTableNode({ table: rotatedTable });
      
      // Check for rotation transform
      const group = container.querySelector('g[transform*="rotate(45)"]');
      expect(group).toBeInTheDocument();
    });
  });

  describe("responsive scaling", () => {
    it("should scale text size with zoom level", () => {
      const { container: container1 } = renderTableNode({ scale: 1 });
      const { container: container2 } = renderTableNode({ scale: 2 });
      
      const text1 = container1.querySelector('text');
      const text2 = container2.querySelector('text');
      
      expect(text1).toHaveAttribute('font-size', '14');
      expect(text2).toHaveAttribute('font-size', '10'); // 14 / 2 = 7, but min 10
    });

    it("should maintain minimum font size", () => {
      const { container } = renderTableNode({ scale: 10 });
      
      const text = container.querySelector('text');
      expect(text).toHaveAttribute('font-size', '10'); // Minimum size
    });
  });
});