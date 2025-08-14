import '@testing-library/jest-dom'

// Mock canvas module for Konva.js compatibility
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Array(4) })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => new ImageData(1, 1)),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    })),
    width: 800,
    height: 600,
  })),
  Image: vi.fn(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
  ImageData: vi.fn((width, height) => ({
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
  })),
}));

// Mock react-konva components directly
vi.mock('react-konva', () => {
  const React = require('react');
  return {
    Stage: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'konva-stage', ...props }, children),
    Layer: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'konva-layer', ...props }, children),
    Group: ({ children, x, y, rotation, ...props }) => React.createElement('g', { 
      'data-testid': 'konva-group',
      transform: `translate(${x || 0}, ${y || 0}) rotate(${rotation || 0})`,
      ...props 
    }, children),
    Circle: ({ x = 0, y = 0, radius, fill, stroke, strokeWidth, ...props }) => React.createElement('circle', {
      'data-testid': 'konva-circle',
      cx: x,
      cy: y,
      radius,
      fill,
      stroke,
      'stroke-width': strokeWidth,
      ...props
    }),
    Rect: ({ x, y, width, height, fill, stroke, strokeWidth, ...props }) => React.createElement('rect', {
      'data-testid': 'konva-rect',
      x,
      y,
      width,
      height,
      fill,
      stroke,
      'stroke-width': strokeWidth,
      ...props
    }),
    Text: ({ x = 0, y = 0, text, fontSize, fill, listening, ...props }) => React.createElement('text', {
      'data-testid': 'konva-text',
      x,
      y,
      'font-size': fontSize,
      fill,
      listening: listening ? 'true' : 'false',
      ...props
    }, text),
  };
});

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock for Konva canvas interactions
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => new ImageData(1, 1)),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
});