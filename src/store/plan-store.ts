import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Table, Vec2 } from "../types";

interface PlanState {
  tables: Table[];
  selectedTableIds: string[];
}

interface PlanActions {
  // Table management
  addTable: (position?: Vec2) => Table;
  updateTable: (id: string, updates: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  getTable: (id: string) => Table | undefined;
  
  // Selection management
  selectTable: (id: string) => void;
  selectTables: (ids: string[]) => void;
  clearSelection: () => void;
  
  // Utility functions
  generateTableId: () => string;
  generateTableName: () => string;
}

type PlanStore = PlanState & PlanActions;

export const usePlanStore = create<PlanStore>((set, get) => ({
  // Initial state
  tables: [],
  selectedTableIds: [],
  
  // Table management actions
  addTable: (position = { x: 0, y: 0 }) => {
    const id = get().generateTableId();
    const name = get().generateTableName();
    
    const newTable: Table = {
      id,
      name,
      shape: "round",
      position,
      seatCount: 8,
      rotation: 0,
      size: {
        width: 120,
        height: 120,
      },
    };
    
    set((state) => ({
      tables: [...state.tables, newTable]
    }));
    
    return newTable;
  },
  
  updateTable: (id: string, updates: Partial<Table>) => {
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === id ? { ...table, ...updates } : table
      )
    }));
  },
  
  deleteTable: (id: string) => {
    set((state) => ({
      tables: state.tables.filter((table) => table.id !== id),
      selectedTableIds: state.selectedTableIds.filter((selectedId) => selectedId !== id)
    }));
  },
  
  getTable: (id: string) => {
    return get().tables.find((table) => table.id === id);
  },
  
  // Selection management
  selectTable: (id: string) => {
    set({ selectedTableIds: [id] });
  },
  
  selectTables: (ids: string[]) => {
    set({ selectedTableIds: ids });
  },
  
  clearSelection: () => {
    set({ selectedTableIds: [] });
  },
  
  // Utility functions
  generateTableId: () => nanoid(),
  
  generateTableName: () => {
    const { tables } = get();
    const tableNumbers = tables
      .map((table) => {
        const match = table.name.match(/^Table (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => num > 0);
    
    const nextNumber = tableNumbers.length > 0 ? Math.max(...tableNumbers) + 1 : 1;
    return `Table ${nextNumber}`;
  },
}));

// Convenience selectors
export const useTables = () => usePlanStore((state) => state.tables);
export const useSelectedTableIds = () => usePlanStore((state) => state.selectedTableIds);
export const useAddTable = () => usePlanStore((state) => state.addTable);
export const useUpdateTable = () => usePlanStore((state) => state.updateTable);
export const useDeleteTable = () => usePlanStore((state) => state.deleteTable);
export const useSelectTable = () => usePlanStore((state) => state.selectTable);
export const useClearTableSelection = () => usePlanStore((state) => state.clearSelection);