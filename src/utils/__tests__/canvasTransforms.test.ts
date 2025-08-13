import { describe, it, expect } from 'vitest'
import {
  clamp,
  snap,
  snapPoint,
  screenToWorld,
  worldToScreen,
  getWorldBounds,
  calculateFitTransform,
  getVisibleGridLines,
  calculateZoomAtPoint,
  distance,
  lerp,
  lerpVec2,
  lerpTransform,
  GRID_SIZE,
} from '../canvasTransforms'
import type { Vec2 } from '../../types'
import type { ViewTransform, Viewport } from '../canvasTransforms'

describe('Canvas Transform Utilities', () => {
  describe('clamp', () => {
    it('should clamp values within bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 0)).toBe(0)
      expect(clamp(5, 5, 5)).toBe(5)
      expect(clamp(-Infinity, 0, 10)).toBe(0)
      expect(clamp(Infinity, 0, 10)).toBe(10)
    })
  })

  describe('snap', () => {
    it('should snap to default grid size', () => {
      expect(snap(0)).toBe(0)
      expect(snap(17)).toBe(20)
      expect(snap(23)).toBe(20)
      expect(snap(31)).toBe(40)
      expect(Math.abs(snap(-7))).toBe(0) // Handle -0 vs 0
      expect(snap(-13)).toBe(-20)
    })

    it('should snap to custom grid size', () => {
      expect(snap(17, 10)).toBe(20)
      expect(snap(23, 10)).toBe(20)
      expect(snap(17, 5)).toBe(15)
      expect(snap(23, 5)).toBe(25)
    })

    it('should handle exact grid values', () => {
      expect(snap(20)).toBe(20)
      expect(snap(40)).toBe(40)
      expect(snap(-20)).toBe(-20)
    })
  })

  describe('snapPoint', () => {
    it('should snap both coordinates', () => {
      expect(snapPoint({ x: 17, y: 23 })).toEqual({ x: 20, y: 20 })
      expect(snapPoint({ x: 31, y: 8 })).toEqual({ x: 40, y: 0 })
      
      const result = snapPoint({ x: -7, y: -13 })
      expect(Math.abs(result.x)).toBe(0) // Handle -0 vs 0
      expect(result.y).toBe(-20)
    })

    it('should work with custom grid size', () => {
      expect(snapPoint({ x: 17, y: 23 }, 10)).toEqual({ x: 20, y: 20 })
      expect(snapPoint({ x: 17, y: 23 }, 5)).toEqual({ x: 15, y: 25 })
    })
  })

  describe('coordinate transformations', () => {
    const transform: ViewTransform = { zoom: 2, pan: { x: 100, y: 200 } }

    describe('screenToWorld', () => {
      it('should convert screen coordinates to world coordinates', () => {
        expect(screenToWorld({ x: 100, y: 200 }, transform)).toEqual({ x: 0, y: 0 })
        expect(screenToWorld({ x: 200, y: 400 }, transform)).toEqual({ x: 50, y: 100 })
        expect(screenToWorld({ x: 0, y: 0 }, transform)).toEqual({ x: -50, y: -100 })
      })

      it('should handle identity transform', () => {
        const identity = { zoom: 1, pan: { x: 0, y: 0 } }
        expect(screenToWorld({ x: 100, y: 200 }, identity)).toEqual({ x: 100, y: 200 })
      })
    })

    describe('worldToScreen', () => {
      it('should convert world coordinates to screen coordinates', () => {
        expect(worldToScreen({ x: 0, y: 0 }, transform)).toEqual({ x: 100, y: 200 })
        expect(worldToScreen({ x: 50, y: 100 }, transform)).toEqual({ x: 200, y: 400 })
        expect(worldToScreen({ x: -50, y: -100 }, transform)).toEqual({ x: 0, y: 0 })
      })

      it('should be inverse of screenToWorld', () => {
        const screenPoint = { x: 150, y: 300 }
        const worldPoint = screenToWorld(screenPoint, transform)
        const backToScreen = worldToScreen(worldPoint, transform)
        
        expect(backToScreen.x).toBeCloseTo(screenPoint.x)
        expect(backToScreen.y).toBeCloseTo(screenPoint.y)
      })
    })
  })

  describe('getWorldBounds', () => {
    it('should calculate world bounds for viewport', () => {
      const viewport: Viewport = { width: 800, height: 600 }
      const transform: ViewTransform = { zoom: 2, pan: { x: 100, y: 200 } }
      
      const bounds = getWorldBounds(viewport, transform)
      
      expect(bounds.min).toEqual({ x: -50, y: -100 })
      expect(bounds.max).toEqual({ x: 350, y: 200 })
      expect(bounds.width).toBe(400)
      expect(bounds.height).toBe(300)
    })

    it('should handle zoom = 1 and no pan', () => {
      const viewport: Viewport = { width: 100, height: 100 }
      const transform: ViewTransform = { zoom: 1, pan: { x: 0, y: 0 } }
      
      const bounds = getWorldBounds(viewport, transform)
      
      expect(bounds.min).toEqual({ x: 0, y: 0 })
      expect(bounds.max).toEqual({ x: 100, y: 100 })
    })
  })

  describe('calculateFitTransform', () => {
    const viewport: Viewport = { width: 800, height: 600 }

    it('should fit bounds to viewport', () => {
      const bounds = { min: { x: 0, y: 0 }, max: { x: 400, y: 300 } }
      
      const transform = calculateFitTransform(bounds, viewport)
      
      // Should fit with some padding
      expect(transform.zoom).toBeGreaterThan(0)
      expect(transform.zoom).toBeLessThanOrEqual(8)
      
      // Should be properly positioned (calculation depends on fit logic)
      expect(transform.pan.x).toBeGreaterThan(0)
      expect(transform.pan.y).toBeGreaterThan(0)
    })

    it('should handle empty bounds', () => {
      const bounds = { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } }
      
      const transform = calculateFitTransform(bounds, viewport)
      
      expect(transform.zoom).toBe(1)
      expect(transform.pan).toEqual({ x: 0, y: 0 })
    })

    it('should respect zoom limits', () => {
      // Very small bounds should hit max zoom
      const smallBounds = { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } }
      const transform = calculateFitTransform(smallBounds, viewport)
      expect(transform.zoom).toBe(8)
      
      // Very large bounds should hit min zoom  
      const largeBounds = { min: { x: 0, y: 0 }, max: { x: 10000, y: 10000 } }
      const transform2 = calculateFitTransform(largeBounds, viewport)
      expect(transform2.zoom).toBe(0.1)
    })
  })

  describe('getVisibleGridLines', () => {
    const viewport: Viewport = { width: 400, height: 300 }
    const transform: ViewTransform = { zoom: 1, pan: { x: 0, y: 0 } }

    it('should return grid lines for visible area', () => {
      const grid = getVisibleGridLines(viewport, transform)
      
      expect(grid.verticals.length).toBeGreaterThan(0)
      expect(grid.horizontals.length).toBeGreaterThan(0)
      
      // Should include major grid lines
      const hasMajorVertical = grid.verticals.some(line => line.major)
      const hasMajorHorizontal = grid.horizontals.some(line => line.major)
      expect(hasMajorVertical).toBe(true)
      expect(hasMajorHorizontal).toBe(true)
    })

    it('should respect line count limits', () => {
      // High zoom showing many grid lines
      const highZoomTransform: ViewTransform = { zoom: 10, pan: { x: 0, y: 0 } }
      const grid = getVisibleGridLines(viewport, highZoomTransform)
      
      expect(grid.verticals.length).toBeLessThanOrEqual(400)
      expect(grid.horizontals.length).toBeLessThanOrEqual(400)
    })

    it('should mark major lines correctly', () => {
      const grid = getVisibleGridLines(viewport, transform, GRID_SIZE, 5)
      
      grid.verticals.forEach(line => {
        const index = Math.round(line.x / GRID_SIZE)
        expect(line.major).toBe(index % 5 === 0)
      })
      
      grid.horizontals.forEach(line => {
        const index = Math.round(line.y / GRID_SIZE)
        expect(line.major).toBe(index % 5 === 0)
      })
    })
  })

  describe('calculateZoomAtPoint', () => {
    const currentTransform: ViewTransform = { zoom: 1, pan: { x: 0, y: 0 } }
    const zoomPoint: Vec2 = { x: 100, y: 100 }

    it('should zoom while keeping point stationary', () => {
      const newTransform = calculateZoomAtPoint(currentTransform, zoomPoint, 2)
      
      expect(newTransform.zoom).toBe(2)
      
      // The zoom point should remain at the same screen position
      const worldPoint = screenToWorld(zoomPoint, currentTransform)
      const newScreenPoint = worldToScreen(worldPoint, newTransform)
      
      expect(newScreenPoint.x).toBeCloseTo(zoomPoint.x)
      expect(newScreenPoint.y).toBeCloseTo(zoomPoint.y)
    })

    it('should respect zoom limits', () => {
      expect(calculateZoomAtPoint(currentTransform, zoomPoint, -1).zoom).toBe(0.1)
      expect(calculateZoomAtPoint(currentTransform, zoomPoint, 10).zoom).toBe(8)
    })

    it('should return same transform if zoom unchanged', () => {
      const result = calculateZoomAtPoint(currentTransform, zoomPoint, 1)
      expect(result).toBe(currentTransform)
    })
  })

  describe('distance', () => {
    it('should calculate distance between points', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
      expect(distance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0)
      expect(distance({ x: -3, y: -4 }, { x: 0, y: 0 })).toBe(5)
    })
  })

  describe('interpolation', () => {
    describe('lerp', () => {
      it('should interpolate between numbers', () => {
        expect(lerp(0, 10, 0)).toBe(0)
        expect(lerp(0, 10, 1)).toBe(10)
        expect(lerp(0, 10, 0.5)).toBe(5)
        expect(lerp(10, 20, 0.3)).toBeCloseTo(13)
      })
    })

    describe('lerpVec2', () => {
      it('should interpolate between vectors', () => {
        const a = { x: 0, y: 0 }
        const b = { x: 10, y: 20 }
        
        expect(lerpVec2(a, b, 0)).toEqual(a)
        expect(lerpVec2(a, b, 1)).toEqual(b)
        expect(lerpVec2(a, b, 0.5)).toEqual({ x: 5, y: 10 })
      })
    })

    describe('lerpTransform', () => {
      it('should interpolate between transforms', () => {
        const a: ViewTransform = { zoom: 1, pan: { x: 0, y: 0 } }
        const b: ViewTransform = { zoom: 2, pan: { x: 100, y: 200 } }
        
        const result = lerpTransform(a, b, 0.5)
        
        expect(result.zoom).toBe(1.5)
        expect(result.pan).toEqual({ x: 50, y: 100 })
      })
    })
  })

  describe('edge cases and integration', () => {
    it('should handle extreme zoom values', () => {
      const viewport: Viewport = { width: 800, height: 600 }
      const extremeTransform: ViewTransform = { zoom: 0.01, pan: { x: 0, y: 0 } }
      
      const bounds = getWorldBounds(viewport, extremeTransform)
      expect(bounds.width).toBeGreaterThan(1000)
      expect(bounds.height).toBeGreaterThan(1000)
      
      const lines = getVisibleGridLines(viewport, extremeTransform)
      expect(lines.verticals.length).toBeLessThanOrEqual(400)
    })

    it('should handle large coordinate values', () => {
      const largeTransform: ViewTransform = { 
        zoom: 1, 
        pan: { x: 1000000, y: 1000000 } 
      }
      
      const screenPoint = { x: 100, y: 100 }
      const worldPoint = screenToWorld(screenPoint, largeTransform)
      const backToScreen = worldToScreen(worldPoint, largeTransform)
      
      expect(backToScreen.x).toBeCloseTo(screenPoint.x)
      expect(backToScreen.y).toBeCloseTo(screenPoint.y)
    })
  })
})