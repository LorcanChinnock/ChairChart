import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlanStore } from "../plan-store";

// Mock nanoid to have predictable IDs
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test-id-123"),
}));

describe("usePlanStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    usePlanStore.getState().tables.splice(0);
    usePlanStore.getState().selectedTableIds.splice(0);
  });

  describe("initial state", () => {
    it("should have empty initial state", () => {
      const { result } = renderHook(() => usePlanStore());
      
      expect(result.current.tables).toEqual([]);
      expect(result.current.selectedTableIds).toEqual([]);
    });
  });

  describe("table management", () => {
    it("should add a table with default properties", () => {
      const { result } = renderHook(() => usePlanStore());
      
      act(() => {
        const table = result.current.addTable({ x: 100, y: 50 });
        
        expect(table).toEqual({
          id: "test-id-123",
          name: "Table 1",
          shape: "round",
          position: { x: 100, y: 50 },
          seatCount: 8,
          rotation: 0,
          size: { width: 120, height: 120 },
        });
      });
      
      expect(result.current.tables).toHaveLength(1);
    });

    it("should add table at origin when no position provided", () => {
      const { result } = renderHook(() => usePlanStore());
      
      act(() => {
        const table = result.current.addTable();
        expect(table.position).toEqual({ x: 0, y: 0 });
      });
    });

    it("should update table properties", () => {
      const { result } = renderHook(() => usePlanStore());
      
      act(() => {
        result.current.addTable({ x: 0, y: 0 });
      });
      
      act(() => {
        result.current.updateTable("test-id-123", {
          name: "Updated Table",
          seatCount: 12,
          position: { x: 200, y: 100 },
        });
      });
      
      const updatedTable = result.current.tables[0];
      expect(updatedTable.name).toBe("Updated Table");
      expect(updatedTable.seatCount).toBe(12);
      expect(updatedTable.position).toEqual({ x: 200, y: 100 });
      expect(updatedTable.shape).toBe("round"); // Unchanged property
    });

    it("should delete table and remove from selection", () => {
      const { result } = renderHook(() => usePlanStore());
      
      act(() => {
        result.current.addTable();
        result.current.selectTable("test-id-123");
      });
      
      expect(result.current.tables).toHaveLength(1);
      expect(result.current.selectedTableIds).toContain("test-id-123");
      
      act(() => {
        result.current.deleteTable("test-id-123");
      });
      
      expect(result.current.tables).toHaveLength(0);
      expect(result.current.selectedTableIds).not.toContain("test-id-123");
    });

    it("should get table by ID", () => {
      const { result } = renderHook(() => usePlanStore());
      
      act(() => {
        result.current.addTable();
      });
      
      const table = result.current.getTable("test-id-123");
      expect(table).toBeDefined();
      expect(table?.id).toBe("test-id-123");
      
      const nonExistentTable = result.current.getTable("non-existent");
      expect(nonExistentTable).toBeUndefined();
    });
  });

  describe("selection management", () => {
    it("should select single table", () => {
      const { result } = renderHook(() => usePlanStore());
      
      act(() => {
        result.current.selectTable("table-1");
      });
      
      expect(result.current.selectedTableIds).toEqual(["table-1"]);
    });

    it("should select multiple tables", () => {
      const { result } = renderHook(() => usePlanStore());
      
      act(() => {
        result.current.selectTables(["table-1", "table-2", "table-3"]);
      });
      
      expect(result.current.selectedTableIds).toEqual(["table-1", "table-2", "table-3"]);
    });

    it("should clear selection", () => {
      const { result } = renderHook(() => usePlanStore());
      
      act(() => {
        result.current.selectTables(["table-1", "table-2"]);
      });
      
      expect(result.current.selectedTableIds).toHaveLength(2);
      
      act(() => {
        result.current.clearSelection();
      });
      
      expect(result.current.selectedTableIds).toEqual([]);
    });
  });

  describe("utility functions", () => {
    it("should generate unique table names", () => {
      const { result } = renderHook(() => usePlanStore());
      
      // Mock different IDs for multiple tables
      const mockNanoid = vi.mocked(vi.fn());
      mockNanoid
        .mockReturnValueOnce("id-1")
        .mockReturnValueOnce("id-2")
        .mockReturnValueOnce("id-3");
      
      vi.doMock("nanoid", () => ({ nanoid: mockNanoid }));
      
      let name1: string, name2: string, name3: string;
      
      act(() => {
        name1 = result.current.generateTableName();
        result.current.addTable();
      });
      
      act(() => {
        name2 = result.current.generateTableName();
        result.current.addTable();
      });
      
      act(() => {
        name3 = result.current.generateTableName();
      });
      
      expect(name1).toBe("Table 1");
      expect(name2).toBe("Table 2");
      expect(name3).toBe("Table 3");
    });

    it("should handle non-sequential table names", () => {
      const { result } = renderHook(() => usePlanStore());
      
      // Manually add tables with non-sequential names
      act(() => {
        const store = usePlanStore.getState();
        store.tables = [
          { id: "1", name: "Table 5", shape: "round", position: { x: 0, y: 0 }, seatCount: 8, rotation: 0, size: { width: 120, height: 120 } },
          { id: "2", name: "Table 2", shape: "round", position: { x: 0, y: 0 }, seatCount: 8, rotation: 0, size: { width: 120, height: 120 } },
          { id: "3", name: "Custom Name", shape: "round", position: { x: 0, y: 0 }, seatCount: 8, rotation: 0, size: { width: 120, height: 120 } },
        ];
      });
      
      const nextName = result.current.generateTableName();
      expect(nextName).toBe("Table 6"); // Should be max + 1
    });
  });
});