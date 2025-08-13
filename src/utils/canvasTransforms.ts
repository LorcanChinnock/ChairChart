import type { Vec2 } from "../types";

export const GRID_SIZE = 20;

export const clamp = (v: number, min: number, max: number): number => 
  Math.min(max, Math.max(min, v));

export const snap = (v: number, gridSize = GRID_SIZE): number => 
  Math.round(v / gridSize) * gridSize;

export const snapPoint = (point: Vec2, gridSize = GRID_SIZE): Vec2 => ({
  x: snap(point.x, gridSize),
  y: snap(point.y, gridSize),
});

export interface ViewTransform {
  zoom: number;
  pan: Vec2;
}

export interface Viewport {
  width: number;
  height: number;
}

export const screenToWorld = (screenPoint: Vec2, transform: ViewTransform): Vec2 => ({
  x: (screenPoint.x - transform.pan.x) / transform.zoom,
  y: (screenPoint.y - transform.pan.y) / transform.zoom,
});

export const worldToScreen = (worldPoint: Vec2, transform: ViewTransform): Vec2 => ({
  x: worldPoint.x * transform.zoom + transform.pan.x,
  y: worldPoint.y * transform.zoom + transform.pan.y,
});

export interface Viewport {
  width: number;
  height: number;
}

export const getWorldBounds = (viewport: Viewport, transform: ViewTransform) => {
  const topLeft = screenToWorld({ x: 0, y: 0 }, transform);
  const bottomRight = screenToWorld({ x: viewport.width, y: viewport.height }, transform);
  
  return {
    min: topLeft,
    max: bottomRight,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
};

export const calculateFitTransform = (
  bounds: { min: Vec2; max: Vec2 },
  viewport: Viewport,
  padding = 20
): ViewTransform => {
  const boundsWidth = bounds.max.x - bounds.min.x;
  const boundsHeight = bounds.max.y - bounds.min.y;
  
  if (boundsWidth <= 0 || boundsHeight <= 0) {
    return { zoom: 1, pan: { x: 0, y: 0 } };
  }
  
  const availableWidth = viewport.width - padding * 2;
  const availableHeight = viewport.height - padding * 2;
  
  const scaleX = availableWidth / boundsWidth;
  const scaleY = availableHeight / boundsHeight;
  const zoom = clamp(Math.min(scaleX, scaleY), 0.1, 8);
  
  const boundsCenter = {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
  };
  
  const viewportCenter = {
    x: viewport.width / 2,
    y: viewport.height / 2,
  };
  
  const pan = {
    x: viewportCenter.x - boundsCenter.x * zoom,
    y: viewportCenter.y - boundsCenter.y * zoom,
  };
  
  return { zoom, pan };
};

export const getVisibleGridLines = (
  viewport: Viewport,
  transform: ViewTransform,
  gridSize = GRID_SIZE,
  majorEvery = 5
) => {
  const worldBounds = getWorldBounds(viewport, transform);
  
  const startX = Math.floor(worldBounds.min.x / gridSize) * gridSize;
  const startY = Math.floor(worldBounds.min.y / gridSize) * gridSize;
  const endX = Math.ceil(worldBounds.max.x / gridSize) * gridSize;
  const endY = Math.ceil(worldBounds.max.y / gridSize) * gridSize;
  
  const verticals: { x: number; major: boolean }[] = [];
  const horizontals: { y: number; major: boolean }[] = [];
  
  const maxLines = 400; // safety cap per direction
  let count = 0;
  
  for (let x = startX; x <= endX && count < maxLines; x += gridSize, count++) {
    const index = Math.round(x / gridSize);
    verticals.push({ x, major: index % majorEvery === 0 });
  }
  
  count = 0;
  for (let y = startY; y <= endY && count < maxLines; y += gridSize, count++) {
    const index = Math.round(y / gridSize);
    horizontals.push({ y, major: index % majorEvery === 0 });
  }
  
  return { verticals, horizontals, worldBounds };
};

export const calculateZoomAtPoint = (
  currentTransform: ViewTransform,
  zoomPoint: Vec2,
  newZoom: number
): ViewTransform => {
  const clampedZoom = clamp(newZoom, 0.1, 8);
  
  if (clampedZoom === currentTransform.zoom) {
    return currentTransform;
  }
  
  // Convert zoom point to world coordinates using current transform
  const worldPoint = screenToWorld(zoomPoint, currentTransform);
  
  // Calculate new pan to keep world point at the same screen position
  const newPan = {
    x: zoomPoint.x - worldPoint.x * clampedZoom,
    y: zoomPoint.y - worldPoint.y * clampedZoom,
  };
  
  return { zoom: clampedZoom, pan: newPan };
};

export const distance = (a: Vec2, b: Vec2): number => 
  Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);

export const lerp = (a: number, b: number, t: number): number => 
  a + (b - a) * t;

export const lerpVec2 = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

export const lerpTransform = (a: ViewTransform, b: ViewTransform, t: number): ViewTransform => ({
  zoom: lerp(a.zoom, b.zoom, t),
  pan: lerpVec2(a.pan, b.pan, t),
});