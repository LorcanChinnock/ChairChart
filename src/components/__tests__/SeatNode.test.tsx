import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Stage, Layer } from "react-konva";
import SeatNode from "../SeatNode";
import type { SeatPosition } from "../../types";

const mockSeat: SeatPosition = {
  position: { x: 50, y: -30 },
  angle: Math.PI / 4, // 45 degrees
  seatNumber: 3,
};

describe("SeatNode", () => {
  const renderSeatNode = (props: Partial<React.ComponentProps<typeof SeatNode>> = {}) => {
    const defaultProps = {
      seat: mockSeat,
      tablePosition: { x: 100, y: 200 },
      isSelected: false,
      scale: 1,
    };

    return render(
      <Stage width={400} height={300}>
        <Layer>
          <SeatNode {...defaultProps} {...props} />
        </Layer>
      </Stage>
    );
  };

  describe("rendering", () => {
    it("should render seat at correct absolute position", () => {
      const { container } = renderSeatNode();
      
      // Should position seat at table position + seat relative position
      // x: 100 + 50 = 150, y: 200 + (-30) = 170
      const group = container.querySelector('g[transform*="translate(150, 170)"]');
      expect(group).toBeInTheDocument();
    });

    it("should apply rotation from seat angle", () => {
      const { container } = renderSeatNode();
      
      // Should have rotation transform (45 degrees in this case)
      const group = container.querySelector('g[transform*="rotate(45)"]');
      expect(group).toBeInTheDocument();
    });

    it("should render seat circle", () => {
      const { container } = renderSeatNode();
      
      const circle = container.querySelector('circle');
      expect(circle).toBeInTheDocument();
      expect(circle).toHaveAttribute('radius', '12'); // Default radius at scale 1
    });

    it("should render seat number", () => {
      const { getByText } = renderSeatNode();
      expect(getByText("3")).toBeInTheDocument();
    });

    it("should apply default styling when not selected", () => {
      const { container } = renderSeatNode({ isSelected: false });
      
      const circle = container.querySelector('circle');
      expect(circle).toHaveAttribute('fill', '#f3f4f6');
      expect(circle).toHaveAttribute('stroke', '#9ca3af');
    });

    it("should apply selected styling when selected", () => {
      const { container } = renderSeatNode({ isSelected: true });
      
      const circle = container.querySelector('circle');
      expect(circle).toHaveAttribute('fill', '#3b82f6');
      expect(circle).toHaveAttribute('stroke', '#1e40af');
      
      const text = container.querySelector('text');
      expect(text).toHaveAttribute('fill', '#ffffff');
    });
  });

  describe("responsive scaling", () => {
    it("should scale seat radius with zoom", () => {
      const { container: container1 } = renderSeatNode({ scale: 1 });
      const { container: container2 } = renderSeatNode({ scale: 2 });
      
      const circle1 = container1.querySelector('circle');
      const circle2 = container2.querySelector('circle');
      
      expect(circle1).toHaveAttribute('radius', '12'); // 12 / 1
      expect(circle2).toHaveAttribute('radius', '8'); // 12 / 2, but min 8
    });

    it("should maintain minimum seat radius", () => {
      const { container } = renderSeatNode({ scale: 10 });
      
      const circle = container.querySelector('circle');
      expect(circle).toHaveAttribute('radius', '8'); // Minimum radius
    });

    it("should scale font size with zoom", () => {
      const { container: container1 } = renderSeatNode({ scale: 1 });
      const { container: container2 } = renderSeatNode({ scale: 2 });
      
      const text1 = container1.querySelector('text');
      const text2 = container2.querySelector('text');
      
      expect(text1).toHaveAttribute('font-size', '12');
      expect(text2).toHaveAttribute('font-size', '8'); // 12 / 2, but min 8
    });

    it("should maintain minimum font size", () => {
      const { container } = renderSeatNode({ scale: 5 });
      
      const text = container.querySelector('text');
      expect(text).toHaveAttribute('font-size', '8'); // Minimum size
    });

    it("should scale stroke width with zoom", () => {
      const { container } = renderSeatNode({ scale: 2 });
      
      const circle = container.querySelector('circle');
      expect(circle).toHaveAttribute('stroke-width', '0.5'); // 1 / scale
    });
  });

  describe("positioning", () => {
    it("should handle different table positions", () => {
      const { container } = renderSeatNode({
        tablePosition: { x: 0, y: 0 },
      });
      
      // With table at origin, seat should be at its relative position
      const group = container.querySelector('g[transform*="translate(50, -30)"]');
      expect(group).toBeInTheDocument();
    });

    it("should handle negative seat positions", () => {
      const seatWithNegativePos: SeatPosition = {
        position: { x: -25, y: -40 },
        angle: 0,
        seatNumber: 1,
      };
      
      const { container } = renderSeatNode({
        seat: seatWithNegativePos,
        tablePosition: { x: 100, y: 100 },
      });
      
      // Absolute position: 100 + (-25) = 75, 100 + (-40) = 60
      const group = container.querySelector('g[transform*="translate(75, 60)"]');
      expect(group).toBeInTheDocument();
    });

    it("should handle different angles correctly", () => {
      const seatWithDifferentAngle: SeatPosition = {
        position: { x: 0, y: 50 },
        angle: Math.PI, // 180 degrees
        seatNumber: 2,
      };
      
      const { container } = renderSeatNode({
        seat: seatWithDifferentAngle,
      });
      
      const group = container.querySelector('g[transform*="rotate(180)"]');
      expect(group).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should not make text interactive", () => {
      const { container } = renderSeatNode();
      
      const text = container.querySelector('text');
      expect(text).toHaveAttribute('listening', 'false');
    });

    it("should render seat numbers from 1 to n", () => {
      const seats = [1, 5, 12, 20].map(seatNumber => ({
        ...mockSeat,
        seatNumber,
      }));
      
      seats.forEach((seat, index) => {
        const { getByText } = render(
          <Stage width={400} height={300}>
            <Layer>
              <SeatNode
                seat={seat}
                tablePosition={{ x: 0, y: 0 }}
                isSelected={false}
                scale={1}
              />
            </Layer>
          </Stage>
        );
        
        expect(getByText(seat.seatNumber.toString())).toBeInTheDocument();
      });
    });
  });
});