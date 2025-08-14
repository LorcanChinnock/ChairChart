import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Inspector from "../Inspector";
import { useInspector, useCloseInspector } from "../../store/ui-store";
import { useUpdateTable, useDeleteTable, usePlanStore } from "../../store/plan-store";

// Mock the store hooks
vi.mock("../../store/ui-store", () => ({
  useInspector: vi.fn(),
  useCloseInspector: vi.fn(),
}));

vi.mock("../../store/plan-store", () => ({
  useUpdateTable: vi.fn(),
  useDeleteTable: vi.fn(),
  usePlanStore: vi.fn(),
}));

const mockTable = {
  id: "table-1",
  name: "Table 1",
  shape: "round" as const,
  position: { x: 100, y: 200 },
  seatCount: 8,
  rotation: 0,
  size: { width: 120, height: 120 },
};

describe("Inspector", () => {
  const mockCloseInspector = vi.fn();
  const mockUpdateTable = vi.fn();
  const mockDeleteTable = vi.fn();
  const mockGetTable = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useCloseInspector as any).mockReturnValue(mockCloseInspector);
    (useUpdateTable as any).mockReturnValue(mockUpdateTable);
    (useDeleteTable as any).mockReturnValue(mockDeleteTable);
    (usePlanStore as any).mockReturnValue(mockGetTable);
    
    mockGetTable.mockReturnValue(mockTable);
  });

  describe("when inspector is closed", () => {
    beforeEach(() => {
      (useInspector as any).mockReturnValue({
        isOpen: false,
        tableId: null,
      });
    });

    it("should not render when inspector is closed", () => {
      render(<Inspector />);
      expect(screen.queryByText("Table Inspector")).not.toBeInTheDocument();
    });
  });

  describe("when inspector is open", () => {
    beforeEach(() => {
      (useInspector as any).mockReturnValue({
        isOpen: true,
        tableId: "table-1",
      });
    });

    it("should render inspector panel when open", () => {
      render(<Inspector />);
      
      expect(screen.getByText("Table Inspector")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Table 1")).toBeInTheDocument();
      expect(screen.getByRole("slider")).toHaveValue("8");
      expect(screen.getByDisplayValue("round")).toBeChecked();
    });

    it("should close inspector when close button is clicked", () => {
      render(<Inspector />);
      
      const closeButton = screen.getByRole("button", { name: /close inspector/i });
      fireEvent.click(closeButton);
      
      expect(mockCloseInspector).toHaveBeenCalledOnce();
    });

    it("should update table name on input change", () => {
      render(<Inspector />);
      
      const nameInput = screen.getByLabelText(/table name/i);
      fireEvent.change(nameInput, { target: { value: "New Table Name" } });
      
      expect(mockUpdateTable).toHaveBeenCalledWith("table-1", {
        name: "New Table Name",
      });
    });

    it("should update table shape and size on shape change", () => {
      render(<Inspector />);
      
      const rectOption = screen.getByDisplayValue("rect");
      fireEvent.click(rectOption);
      
      expect(mockUpdateTable).toHaveBeenCalledWith("table-1", {
        shape: "rect",
        size: { width: 160, height: 80 },
      });
    });

    it("should update seat count on slider change", () => {
      render(<Inspector />);
      
      const slider = screen.getByRole("slider");
      fireEvent.change(slider, { target: { value: "12" } });
      
      expect(mockUpdateTable).toHaveBeenCalledWith("table-1", {
        seatCount: 12,
      });
    });

    it("should update seat count on number input change", () => {
      render(<Inspector />);
      
      const numberInput = screen.getByRole("spinbutton");
      fireEvent.change(numberInput, { target: { value: "15" } });
      
      expect(mockUpdateTable).toHaveBeenCalledWith("table-1", {
        seatCount: 15,
      });
    });

    it("should clamp seat count to valid range (1-20)", () => {
      render(<Inspector />);
      
      const numberInput = screen.getByRole("spinbutton");
      
      // Test upper bound
      fireEvent.change(numberInput, { target: { value: "25" } });
      expect(mockUpdateTable).toHaveBeenCalledWith("table-1", {
        seatCount: 20,
      });
      
      // Test lower bound
      fireEvent.change(numberInput, { target: { value: "0" } });
      expect(mockUpdateTable).toHaveBeenCalledWith("table-1", {
        seatCount: 1,
      });
    });

    it("should display current table settings", () => {
      render(<Inspector />);
      
      expect(screen.getByText("Current Settings")).toBeInTheDocument();
      expect(screen.getByText("Seats: 8")).toBeInTheDocument();
      expect(screen.getByText("Position: (100, 200)")).toBeInTheDocument();
      expect(screen.getByText("Size: 120 × 120")).toBeInTheDocument();
    });
  });

  describe("delete functionality", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      (useInspector as any).mockReturnValue({
        isOpen: true,
        tableId: "table-1",
      });
      (useCloseInspector as any).mockReturnValue(mockCloseInspector);
      (useUpdateTable as any).mockReturnValue(mockUpdateTable);
      (useDeleteTable as any).mockReturnValue(mockDeleteTable);
      (usePlanStore as any).mockReturnValue(mockGetTable);
      mockGetTable.mockReturnValue(mockTable);
    });

    it("should show delete confirmation dialog when delete button is clicked", () => {
      render(<Inspector />);
      
      const deleteButton = screen.getByRole("button", { name: /delete table/i });
      fireEvent.click(deleteButton);
      
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete "Table 1"/)).toBeInTheDocument();
    });

    it("should not delete table when cancel is clicked", async () => {
      render(<Inspector />);
      
      // Open delete dialog - use getAllByRole to get the specific button (not the heading)
      const buttons = screen.getAllByRole("button");
      const deleteButton = buttons.find(button => button.textContent === "Delete Table");
      fireEvent.click(deleteButton!);
      
      // Verify dialog is open
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      
      // Click cancel
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockDeleteTable).not.toHaveBeenCalled();
      
      // Wait for dialog to close
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("should delete table and close inspector when confirmed", () => {
      render(<Inspector />);
      
      // Open delete dialog
      const deleteButton = screen.getByRole("button", { name: /delete table/i });
      fireEvent.click(deleteButton);
      
      // Confirm delete
      const confirmButton = screen.getByRole("button", { name: "Delete" });
      fireEvent.click(confirmButton);
      
      expect(mockDeleteTable).toHaveBeenCalledWith("table-1");
      expect(mockCloseInspector).toHaveBeenCalledOnce();
    });
  });

  describe("when table doesn't exist", () => {
    beforeEach(() => {
      (useInspector as any).mockReturnValue({
        isOpen: true,
        tableId: "nonexistent-table",
      });
      mockGetTable.mockReturnValue(null);
    });

    it("should not render inspector when table doesn't exist", () => {
      render(<Inspector />);
      expect(screen.queryByText("Table Inspector")).not.toBeInTheDocument();
    });
  });

  describe("shape size adjustments", () => {
    beforeEach(() => {
      (useInspector as any).mockReturnValue({
        isOpen: true,
        tableId: "table-1",
      });
    });

    it("should set correct size for round shape", () => {
      // Change mock table to have a different shape initially
      mockGetTable.mockReturnValue({
        ...mockTable,
        shape: "rect"
      });
      
      render(<Inspector />);
      
      const roundOption = screen.getByDisplayValue("round");
      fireEvent.click(roundOption);
      
      expect(mockUpdateTable).toHaveBeenCalledWith("table-1", {
        shape: "round",
        size: { width: 120, height: 120 },
      });
    });

    it("should set correct size for square shape", () => {
      render(<Inspector />);
      
      const squareOption = screen.getByDisplayValue("square");
      fireEvent.click(squareOption);
      
      expect(mockUpdateTable).toHaveBeenCalledWith("table-1", {
        shape: "square",
        size: { width: 120, height: 120 },
      });
    });

    it("should set correct size for rectangle shape", () => {
      render(<Inspector />);
      
      const rectOption = screen.getByDisplayValue("rect");
      fireEvent.click(rectOption);
      
      expect(mockUpdateTable).toHaveBeenCalledWith("table-1", {
        shape: "rect",
        size: { width: 160, height: 80 },
      });
    });
  });
});