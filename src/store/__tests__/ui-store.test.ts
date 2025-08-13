import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../ui-store'

describe('UI Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useUIStore.setState({
      zoom: 1,
      pan: { x: 0, y: 0 },
      selection: {
        selectedIds: [],
        selectionRect: null,
      },
    })
  })

  describe('Zoom actions', () => {
    it('should set zoom level', () => {
      const { setZoom } = useUIStore.getState()
      
      setZoom(2.5)
      
      expect(useUIStore.getState().zoom).toBe(2.5)
    })

    it('should handle boundary zoom values', () => {
      const { setZoom } = useUIStore.getState()
      
      // Test minimum zoom
      setZoom(0.1)
      expect(useUIStore.getState().zoom).toBe(0.1)
      
      // Test maximum zoom
      setZoom(5.0)
      expect(useUIStore.getState().zoom).toBe(5.0)
      
      // Test zero zoom (edge case)
      setZoom(0)
      expect(useUIStore.getState().zoom).toBe(0)
    })

    it('should handle negative zoom values', () => {
      const { setZoom } = useUIStore.getState()
      
      setZoom(-1)
      expect(useUIStore.getState().zoom).toBe(-1)
    })
  })

  describe('Pan actions', () => {
    it('should set pan position', () => {
      const { setPan } = useUIStore.getState()
      
      setPan({ x: 100, y: 200 })
      
      const { pan } = useUIStore.getState()
      expect(pan.x).toBe(100)
      expect(pan.y).toBe(200)
    })

    it('should update pan with delta', () => {
      const { setPan, updatePan } = useUIStore.getState()
      
      // Set initial position
      setPan({ x: 50, y: 100 })
      
      // Update with delta
      updatePan({ x: 25, y: -30 })
      
      const { pan } = useUIStore.getState()
      expect(pan.x).toBe(75)
      expect(pan.y).toBe(70)
    })

    it('should accumulate multiple pan deltas', () => {
      const { updatePan } = useUIStore.getState()
      
      updatePan({ x: 10, y: 20 })
      updatePan({ x: 5, y: -15 })
      updatePan({ x: -3, y: 8 })
      
      const { pan } = useUIStore.getState()
      expect(pan.x).toBe(12) // 0 + 10 + 5 - 3
      expect(pan.y).toBe(13) // 0 + 20 - 15 + 8
    })

    it('should handle extreme pan coordinates', () => {
      const { setPan } = useUIStore.getState()
      
      setPan({ x: -10000, y: 10000 })
      
      const { pan } = useUIStore.getState()
      expect(pan.x).toBe(-10000)
      expect(pan.y).toBe(10000)
    })
  })

  describe('Selection actions', () => {
    it('should set selection array', () => {
      const { setSelection } = useUIStore.getState()
      
      setSelection(['item1', 'item2', 'item3'])
      
      const { selection } = useUIStore.getState()
      expect(selection.selectedIds).toEqual(['item1', 'item2', 'item3'])
    })

    it('should add item to selection without duplicates', () => {
      const { setSelection, addToSelection } = useUIStore.getState()
      
      // Set initial selection
      setSelection(['item1', 'item2'])
      
      // Add new item
      addToSelection('item3')
      expect(useUIStore.getState().selection.selectedIds).toEqual(['item1', 'item2', 'item3'])
      
      // Try to add duplicate - should not add
      addToSelection('item2')
      expect(useUIStore.getState().selection.selectedIds).toEqual(['item1', 'item2', 'item3'])
    })

    it('should remove item from selection', () => {
      const { setSelection, removeFromSelection } = useUIStore.getState()
      
      setSelection(['item1', 'item2', 'item3'])
      
      removeFromSelection('item2')
      
      expect(useUIStore.getState().selection.selectedIds).toEqual(['item1', 'item3'])
    })

    it('should handle removing non-existent item', () => {
      const { setSelection, removeFromSelection } = useUIStore.getState()
      
      setSelection(['item1', 'item2'])
      
      removeFromSelection('item3')
      
      expect(useUIStore.getState().selection.selectedIds).toEqual(['item1', 'item2'])
    })

    it('should clear selection', () => {
      const { setSelection, clearSelection } = useUIStore.getState()
      
      setSelection(['item1', 'item2', 'item3'])
      
      clearSelection()
      
      expect(useUIStore.getState().selection.selectedIds).toEqual([])
    })

    it('should set selection rectangle', () => {
      const { setSelectionRect } = useUIStore.getState()
      
      const rect = { start: { x: 10, y: 20 }, end: { x: 100, y: 150 } }
      setSelectionRect(rect)
      
      expect(useUIStore.getState().selection.selectionRect).toEqual(rect)
    })

    it('should clear selection rectangle', () => {
      const { setSelectionRect } = useUIStore.getState()
      
      // Set rectangle first
      setSelectionRect({ start: { x: 0, y: 0 }, end: { x: 50, y: 50 } })
      
      // Clear it
      setSelectionRect(null)
      
      expect(useUIStore.getState().selection.selectionRect).toBe(null)
    })

    it('should handle large selection arrays', () => {
      const { setSelection, addToSelection } = useUIStore.getState()
      
      // Create large selection
      const largeSelection = Array.from({ length: 1000 }, (_, i) => `item${i}`)
      setSelection(largeSelection)
      
      expect(useUIStore.getState().selection.selectedIds).toHaveLength(1000)
      
      // Add one more
      addToSelection('newItem')
      expect(useUIStore.getState().selection.selectedIds).toHaveLength(1001)
      expect(useUIStore.getState().selection.selectedIds).toContain('newItem')
    })
  })

  describe('Combined view actions', () => {
    it('should set zoom and pan simultaneously', () => {
      const { setView } = useUIStore.getState()
      
      setView(2.0, { x: 150, y: 250 })
      
      const state = useUIStore.getState()
      expect(state.zoom).toBe(2.0)
      expect(state.pan.x).toBe(150)
      expect(state.pan.y).toBe(250)
    })

    it('should not affect selection when setting view', () => {
      const { setSelection, setView } = useUIStore.getState()
      
      // Set initial selection
      setSelection(['item1', 'item2'])
      
      // Change view
      setView(3.0, { x: 100, y: 200 })
      
      // Selection should remain unchanged
      expect(useUIStore.getState().selection.selectedIds).toEqual(['item1', 'item2'])
    })
  })

  describe('State immutability', () => {
    it('should not mutate previous state when updating selection', () => {
      const { setSelection, addToSelection } = useUIStore.getState()
      
      setSelection(['item1'])
      const firstState = useUIStore.getState().selection.selectedIds
      
      addToSelection('item2')
      const secondState = useUIStore.getState().selection.selectedIds
      
      // Previous state should not be mutated
      expect(firstState).toEqual(['item1'])
      expect(secondState).toEqual(['item1', 'item2'])
      expect(firstState).not.toBe(secondState)
    })

    it('should not mutate pan object when updating', () => {
      const { setPan, updatePan } = useUIStore.getState()
      
      setPan({ x: 10, y: 20 })
      const firstPan = useUIStore.getState().pan
      
      updatePan({ x: 5, y: 5 })
      const secondPan = useUIStore.getState().pan
      
      expect(firstPan).toEqual({ x: 10, y: 20 })
      expect(secondPan).toEqual({ x: 15, y: 25 })
      expect(firstPan).not.toBe(secondPan)
    })
  })

  describe('Convenience selectors', () => {
    it('should provide zoom selector', () => {
      const { setZoom } = useUIStore.getState()
      setZoom(1.5)
      
      expect(useUIStore.getState().zoom).toBe(1.5)
    })

    it('should provide pan selector', () => {
      const { setPan } = useUIStore.getState()
      setPan({ x: 100, y: 200 })
      
      expect(useUIStore.getState().pan).toEqual({ x: 100, y: 200 })
    })

    it('should provide selection selector', () => {
      const { setSelection } = useUIStore.getState()
      setSelection(['test'])
      
      expect(useUIStore.getState().selection.selectedIds).toEqual(['test'])
    })
  })
})