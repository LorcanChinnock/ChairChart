import { create } from "zustand";

type Vec2 = { x: number; y: number };

interface UIState {
  // Zoom state
  zoom: number;
  
  // Pan state
  pan: Vec2;
  
  // Selection state
  selection: {
    selectedIds: string[];
    selectionRect: { start: Vec2; end: Vec2 } | null;
  };
}

interface UIActions {
  // Zoom actions
  setZoom: (zoom: number) => void;
  
  // Pan actions
  setPan: (pan: Vec2) => void;
  updatePan: (delta: Vec2) => void;
  
  // Selection actions
  setSelection: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  setSelectionRect: (rect: { start: Vec2; end: Vec2 } | null) => void;
  
  // Combined view actions
  setView: (zoom: number, pan: Vec2) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial state
  zoom: 1,
  pan: { x: 0, y: 0 },
  selection: {
    selectedIds: [],
    selectionRect: null,
  },
  
  // Zoom actions
  setZoom: (zoom: number) => set({ zoom }),
  
  // Pan actions
  setPan: (pan: Vec2) => set({ pan }),
  updatePan: (delta: Vec2) => {
    const currentPan = get().pan;
    set({ pan: { x: currentPan.x + delta.x, y: currentPan.y + delta.y } });
  },
  
  // Selection actions
  setSelection: (selectedIds: string[]) => 
    set((state) => ({ selection: { ...state.selection, selectedIds } })),
  
  addToSelection: (id: string) => {
    const { selection } = get();
    if (!selection.selectedIds.includes(id)) {
      set((state) => ({ 
        selection: { 
          ...state.selection, 
          selectedIds: [...state.selection.selectedIds, id] 
        } 
      }));
    }
  },
  
  removeFromSelection: (id: string) => 
    set((state) => ({ 
      selection: { 
        ...state.selection, 
        selectedIds: state.selection.selectedIds.filter((selectedId) => selectedId !== id) 
      } 
    })),
  
  clearSelection: () => 
    set((state) => ({ 
      selection: { 
        ...state.selection, 
        selectedIds: [] 
      } 
    })),
  
  setSelectionRect: (selectionRect: { start: Vec2; end: Vec2 } | null) => 
    set((state) => ({ selection: { ...state.selection, selectionRect } })),
  
  // Combined view actions
  setView: (zoom: number, pan: Vec2) => set({ zoom, pan }),
}));

// Convenience selectors
export const useZoom = () => useUIStore((state) => state.zoom);
export const usePan = () => useUIStore((state) => state.pan);
export const useSelection = () => useUIStore((state) => state.selection);
export const useSetZoom = () => useUIStore((state) => state.setZoom);
export const useSetPan = () => useUIStore((state) => state.setPan);
export const useUpdatePan = () => useUIStore((state) => state.updatePan);
export const useSetView = () => useUIStore((state) => state.setView);