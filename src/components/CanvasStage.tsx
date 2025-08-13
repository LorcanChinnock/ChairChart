"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Rect } from "react-konva";
import type Konva from "konva";
import { useZoom, usePan, useSetPan, useSetView } from "../store/ui-store";

type Vec2 = { x: number; y: number };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const useViewportSize = () => {
  const [size, setSize] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  }));

  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
};

function GridLayer({ width, height, scale, offset, isDarkMode }: { width: number; height: number; scale: number; offset: Vec2; isDarkMode: boolean }) {
  const grid = 20; // world units
  const majorEvery = 5; // every 5 minor lines
  
  // Explicit theme colors - no CSS classes, no system detection
  const colors = isDarkMode 
    ? {
        minor: "#1e3a5f", // Slightly lighter blue for minor grid lines
        major: "#2d4a6b"  // More visible blue for major grid lines
      }
    : {
        minor: "#e8d5b7", // Soft beige for minor grid lines
        major: "#d4c4a8"  // Slightly darker beige for major grid lines  
      };
  
  const colorMinor = colors.minor;
  const colorMajor = colors.major;

  // Compute visible world bounds
  const worldMinX = (-offset.x) / scale;
  const worldMinY = (-offset.y) / scale;
  const worldMaxX = (width - offset.x) / scale;
  const worldMaxY = (height - offset.y) / scale;

  // Find first grid line positions <= min
  const startX = Math.floor(worldMinX / grid) * grid;
  const startY = Math.floor(worldMinY / grid) * grid;
  const endX = Math.ceil(worldMaxX / grid) * grid;
  const endY = Math.ceil(worldMaxY / grid) * grid;

  const verticals: { x: number; major: boolean }[] = [];
  const horizontals: { y: number; major: boolean }[] = [];

  const maxLines = 400; // safety cap per direction
  let count = 0;
  for (let x = startX; x <= endX && count < maxLines; x += grid, count++) {
    const index = Math.round(x / grid);
    verticals.push({ x, major: index % majorEvery === 0 });
  }
  count = 0;
  for (let y = startY; y <= endY && count < maxLines; y += grid, count++) {
    const index = Math.round(y / grid);
    horizontals.push({ y, major: index % majorEvery === 0 });
  }

  const strokeMinor = Math.max(0.5 / scale, 0.15); // thinner, more subtle
  const strokeMajor = Math.max(0.8 / scale, 0.3); // reduced thickness

  return (
    <Layer listening={false} name="grid">
      {verticals.map(({ x, major }, i) => (
        <Line
          key={`v-${i}-${x}`}
          points={[x, worldMinY, x, worldMaxY]}
          stroke={major ? colorMajor : colorMinor}
          strokeWidth={major ? strokeMajor : strokeMinor}
          // make sure lines cover full viewport after transform
          x={0}
          y={0}
        />
      ))}
      {horizontals.map(({ y, major }, i) => (
        <Line
          key={`h-${i}-${y}`}
          points={[worldMinX, y, worldMaxX, y]}
          stroke={major ? colorMajor : colorMinor}
          strokeWidth={major ? strokeMajor : strokeMinor}
          x={0}
          y={0}
        />
      ))}
    </Layer>
  );
}

export default function CanvasStage() {
  const { width, height } = useViewportSize();
  const stageRef = useRef<Konva.Stage>(null);

  // Use Zustand store for zoom/pan state
  const zoom = useZoom();
  const pan = usePan();
  const setPan = useSetPan();
  const setView = useSetView();
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isMiddlePanning, setIsMiddlePanning] = useState(false);
  const [isLeftPanning, setIsLeftPanning] = useState(false);
  const [isNodeDragging, setIsNodeDragging] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Always start in light mode
  const lastPointerRef = useRef<Vec2 | null>(null);

  const isPanning = isSpaceDown || isMiddlePanning || isLeftPanning;

  // Get explicit background color based on our theme state only
  const backgroundColor = isDarkMode ? "#0f1729" : "#faf7f0"; // Night sky blue vs warm cream
  
  // Button styling based on our theme only
  const buttonStyle = {
    backgroundColor: isDarkMode ? "#1e3a5f" : "#f5f1e8",
    color: isDarkMode ? "#e2e8f0" : "#374151",
    border: isDarkMode ? "1px solid #2d4a6b" : "1px solid #d4c4a8",
  };
  
  const buttonHoverStyle = {
    backgroundColor: isDarkMode ? "#2d4a6b" : "#ede7db",
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Smooth zoom animation
  const zoomAnimRef = useRef<{ id: number | null } | null>({ id: null });

  const cancelZoomAnim = useCallback(() => {
    const ref = zoomAnimRef.current;
    if (ref && ref.id != null) {
      cancelAnimationFrame(ref.id);
      ref.id = null;
    }
  }, []);

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  // Animate full view (scale and position) to targets
  const animateViewTo = useCallback(
    (targetScale: number, targetPos: Vec2, duration = 200) => {
      cancelZoomAnim();
      const startScale = zoom;
      const startPos = { ...pan };
      const endScale = clamp(targetScale, 0.1, 8);
      const endPos = targetPos;
      const start = performance.now();
      const step = () => {
        const now = performance.now();
        const t = Math.min(1, (now - start) / duration);
        const k = easeOutCubic(t);
        const s = startScale + (endScale - startScale) * k;
        const x = startPos.x + (endPos.x - startPos.x) * k;
        const y = startPos.y + (endPos.y - startPos.y) * k;
        setView(s, { x, y });
        if (t < 1 && zoomAnimRef.current) {
          zoomAnimRef.current.id = requestAnimationFrame(step);
        } else if (zoomAnimRef.current) {
          zoomAnimRef.current.id = null;
        }
      };
      if (zoomAnimRef.current) {
        zoomAnimRef.current.id = requestAnimationFrame(step);
      }
    },
    [cancelZoomAnim, pan, zoom, setView]
  );

  // Animate zoom anchored at a screen-space center point
  const animateZoomAt = useCallback(
    (center: Vec2, targetScale: number, duration = 180) => {
      const endScale = clamp(targetScale, 0.1, 8);
      const anchorWorld = { x: (center.x - pan.x) / zoom, y: (center.y - pan.y) / zoom };
      const targetPos = { x: center.x - anchorWorld.x * endScale, y: center.y - anchorWorld.y * endScale };
      animateViewTo(endScale, targetPos, duration);
    },
    [animateViewTo, pan.x, pan.y, zoom]
  );

  // Demo node setup (snapping utilities)
  const demoRef = useRef<Konva.Rect>(null);
  const GRID = 20;
  const snap = (v: number) => Math.round(v / GRID) * GRID;

  // Wheel: zoom with ctrl/meta; otherwise pan
  const onWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    const evt = e.evt;
    if (evt.ctrlKey || evt.metaKey) {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition() ?? { x: width / 2, y: height / 2 };
      // Immediate pointer-anchored zoom (no animation)
      cancelZoomAnim();
      const oldScale = zoom;
      const scaleBy = 1.05;
      const direction = evt.deltaY > 0 ? 1 : -1;
      const newScale = clamp(direction > 0 ? oldScale / scaleBy : oldScale * scaleBy, 0.1, 8);
      const anchorWorld = { x: (pointer.x - pan.x) / oldScale, y: (pointer.y - pan.y) / oldScale };
      setView(newScale, { x: pointer.x - anchorWorld.x * newScale, y: pointer.y - anchorWorld.y * newScale });
      return;
    }

    // Trackpad / wheel panning
    setPan({ x: pan.x - evt.deltaX, y: pan.y - evt.deltaY });
  }, [cancelZoomAnim, height, pan.x, pan.y, zoom, width, setPan, setView]);

  // Keyboard handlers on the container
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Space toggles panning
      if (e.code === "Space") {
        if (!isSpaceDown) {
          setIsSpaceDown(true);
        }
        e.preventDefault();
        return;
      }

      // Zoom +/-
      if (e.key === "+" || e.key === "=" || e.key === "]") {
        e.preventDefault();
        const center = { x: width / 2, y: height / 2 };
        animateZoomAt(center, zoom * 1.1);
        return;
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        const center = { x: width / 2, y: height / 2 };
        animateZoomAt(center, zoom / 1.1);
        return;
      }

      // Reset (0)
      if (e.key === "0") {
        e.preventDefault();
        animateViewTo(1, { x: 0, y: 0 }, 200);
        return;
      }

      // Fit-to-view (1) for demo node
      if (e.key === "1") {
        e.preventDefault();
        const node = demoRef.current;
        if (node) {
          const rectX = node.x();
          const rectY = node.y();
          const rectW = node.width();
          const rectH = node.height();
          if (rectW > 0 && rectH > 0) {
            const padding = 40; // screen-space padding
            const availW = Math.max(1, width - padding * 2);
            const availH = Math.max(1, height - padding * 2);
            const scaleFit = clamp(Math.min(availW / rectW, availH / rectH), 0.1, 8);
            const centerWorld = { x: rectX + rectW / 2, y: rectY + rectH / 2 };
            const posFit = {
              x: width / 2 - centerWorld.x * scaleFit,
              y: height / 2 - centerWorld.y * scaleFit,
            };
            animateViewTo(scaleFit, posFit, 220);
          }
        }
        return;
      }

      // Arrow keys pan (screen space)
      const step = e.shiftKey ? 100 : 50;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPan({ x: pan.x + step, y: pan.y });
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setPan({ x: pan.x - step, y: pan.y });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setPan({ x: pan.x, y: pan.y + step });
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPan({ x: pan.x, y: pan.y - step });
        return;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpaceDown(false);
      }
    };

    el.addEventListener("keydown", onKeyDown);
    el.addEventListener("keyup", onKeyUp);
    return () => {
      el.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("keyup", onKeyUp);
    };
  }, [animateViewTo, animateZoomAt, height, isSpaceDown, zoom, width, pan, setPan]);

  // Demo node setup moved above

  const onMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (isNodeDragging) {
      e.cancelBubble = true;
      return;
    }
    // Middle mouse: enable Stage drag panning
    if (e.evt.button === 1) {
      cancelZoomAnim();
      setIsMiddlePanning(true);
      return;
    }
    // Left mouse on empty stage: manual panning (unless user is holding ctrl/meta for zoom)
    if (e.evt.button === 0 && !(e.evt.ctrlKey || e.evt.metaKey)) {
      if (stage && e.target === stage) {
        cancelZoomAnim();
        const p = stage.getPointerPosition();
        if (p) {
          lastPointerRef.current = p;
          setIsLeftPanning(true);
        }
      }
    }
  }, [cancelZoomAnim, isNodeDragging]);
  const onMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1) {
      setIsMiddlePanning(false);
    }
    if (e.evt.button === 0) {
      setIsLeftPanning(false);
      lastPointerRef.current = null;
    }
  }, []);

  const onMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isNodeDragging) {
      e.cancelBubble = true;
      // if a node begins dragging after a stage mousedown, stop manual panning
      if (isLeftPanning) setIsLeftPanning(false);
      return;
    }
    if (!isLeftPanning) return;
    const stage = stageRef.current;
    if (!stage) return;
    const p = stage.getPointerPosition();
    const last = lastPointerRef.current;
    if (p && last) {
      const dx = p.x - last.x;
      const dy = p.y - last.y;
      if (dx !== 0 || dy !== 0) {
        setPan({ x: pan.x + dx, y: pan.y + dy });
        lastPointerRef.current = p;
      }
    }
  }, [isLeftPanning, isNodeDragging, pan, setPan]);

  const onStageDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = stageRef.current;
    if (!stage || e.target !== stage) return;
    setPan({ x: stage.x(), y: stage.y() });
  }, []);

  const cursor = isPanning ? "grabbing" : isSpaceDown ? "grab" : "default";

  // Cancel animation on unmount
  useEffect(() => cancelZoomAnim, [cancelZoomAnim]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      style={{ 
        width: "100vw", 
        height: "100vh", 
        outline: "none", 
        cursor, 
        position: "relative",
        backgroundColor
      }}
      aria-label="Seating plan canvas"
      role="application"
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        x={pan.x}
        y={pan.y}
        scaleX={zoom}
        scaleY={zoom}
        draggable={(isSpaceDown || isMiddlePanning) && !isNodeDragging}
  onDragMove={onStageDragMove}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        onMouseLeave={() => {
          // end manual panning if the pointer leaves the stage
          if (isLeftPanning) {
            setIsLeftPanning(false);
            lastPointerRef.current = null;
          }
        }}
      >
        <GridLayer width={width} height={height} scale={zoom} offset={pan} isDarkMode={isDarkMode} />
        {/* Demo node layer */}
        <Layer name="nodes">
          <Rect
            ref={demoRef}
            x={100}
            y={100}
            width={160}
            height={100}
            cornerRadius={8}
            fill="#3b82f6"
            stroke="#1e40af"
            strokeWidth={1}
            opacity={0.9}
            draggable
            dragBoundFunc={(pos) => ({ x: snap(pos.x), y: snap(pos.y) })}
            onMouseDown={(e) => {
              // prevent Stage from initiating manual panning
              e.cancelBubble = true;
            }}
            onDragStart={(e) => {
              e.cancelBubble = true;
              setIsNodeDragging(true);
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              setIsNodeDragging(false);
              // ensure final snap (Konva already applied dragBoundFunc, but keep deterministic)
              const node = demoRef.current;
              if (node) {
                node.position({ x: snap(node.x()), y: snap(node.y()) });
              }
            }}
            shadowColor="black"
            shadowBlur={4}
            shadowOpacity={0.2}
          />
        </Layer>
        {/* Future content layers will go above */}
      </Stage>
      
      {/* Dark mode toggle */}
      <div className="absolute top-4 right-4 z-10 select-none">
        <button
          type="button"
          onClick={toggleDarkMode}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "6px",
            ...buttonStyle,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            transition: "all 0.2s",
            cursor: "pointer"
          }}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>
      </div>
      
      {/* Zoom controls */}
      <div className="absolute right-4 bottom-4 z-10 flex flex-col gap-2 select-none" aria-label="Zoom controls">
        <button
          type="button"
          onClick={() => animateZoomAt({ x: width / 2, y: height / 2 }, zoom * 1.1)}
          title="Zoom in (+)"
          aria-label="Zoom in"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "6px",
            ...buttonStyle,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            fontSize: "18px",
            lineHeight: "1",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          +
        </button>
        <button
          type="button"
          onClick={() => animateZoomAt({ x: width / 2, y: height / 2 }, zoom / 1.1)}
          title="Zoom out (-)"
          aria-label="Zoom out"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "6px",
            ...buttonStyle,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            fontSize: "18px",
            lineHeight: "1",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          −
        </button>
      </div>
      
      {/* Keyboard shortcuts help */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 select-none">
        <div className="flex flex-col items-center">
          {/* Toggle button */}
          <button
            type="button"
            onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
            style={{
              marginBottom: "8px",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
              ...buttonStyle,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
            }}
            title={showKeyboardHelp ? "Hide keyboard shortcuts" : "Show keyboard shortcuts"}
          >
            ⌨️ {showKeyboardHelp ? "Hide" : "Shortcuts"}
          </button>
          
          {/* Shortcuts panel */}
          {showKeyboardHelp && (
            <div style={{
              backgroundColor: isDarkMode ? "#1e3a5f" : "#f5f1e8",
              border: isDarkMode ? "1px solid #2d4a6b" : "1px solid #d4c4a8",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              padding: "16px",
              maxWidth: "384px",
              backdropFilter: "blur(4px)"
            }}>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr", 
                gap: "8px 24px", 
                fontSize: "14px" 
              }}>
                {[
                  ["Pan", "Space + Drag"],
                  ["Zoom", "Ctrl + Scroll"], 
                  ["Zoom In", "+"],
                  ["Zoom Out", "-"],
                  ["Reset View", "0"],
                  ["Fit Demo", "1"]
                ].map(([label, key]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: isDarkMode ? "#cbd5e1" : "#6b7280" }}>{label}</span>
                    <kbd style={{
                      padding: "2px 6px",
                      backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
                      border: isDarkMode ? "1px solid #4b5563" : "1px solid #e5e7eb",
                      borderRadius: "3px",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      color: isDarkMode ? "#e5e7eb" : "#374151"
                    }}>{key}</kbd>
                  </div>
                ))}
                <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: isDarkMode ? "#cbd5e1" : "#6b7280" }}>Pan with arrows</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <kbd style={{
                      padding: "2px 6px",
                      backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
                      border: isDarkMode ? "1px solid #4b5563" : "1px solid #e5e7eb",
                      borderRadius: "3px",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      color: isDarkMode ? "#e5e7eb" : "#374151"
                    }}>↑↓←→</kbd>
                    <span style={{ color: isDarkMode ? "#9ca3af" : "#6b7280", fontSize: "12px" }}>+ Shift for larger steps</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
