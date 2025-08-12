"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Rect } from "react-konva";
import type Konva from "konva";

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

function GridLayer({ width, height, scale, offset }: { width: number; height: number; scale: number; offset: Vec2 }) {
  const grid = 20; // world units
  const majorEvery = 5; // every 5 minor lines
  const colorMinor = "#e5e7eb"; // gray-200
  const colorMajor = "#d1d5db"; // gray-300

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

  const strokeMinor = Math.max(0.75 / scale, 0.25);
  const strokeMajor = Math.max(1.25 / scale, 0.5);

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

  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState<Vec2>({ x: 0, y: 0 });
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isMiddlePanning, setIsMiddlePanning] = useState(false);
  const [isLeftPanning, setIsLeftPanning] = useState(false);
  const [isNodeDragging, setIsNodeDragging] = useState(false);
  const lastPointerRef = useRef<Vec2 | null>(null);

  const isPanning = isSpaceDown || isMiddlePanning || isLeftPanning;

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
      const startScale = scale;
      const startPos = { ...pos };
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
        setScale(s);
        setPos({ x, y });
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
    [cancelZoomAnim, pos, scale]
  );

  // Animate zoom anchored at a screen-space center point
  const animateZoomAt = useCallback(
    (center: Vec2, targetScale: number, duration = 180) => {
      const endScale = clamp(targetScale, 0.1, 8);
      const anchorWorld = { x: (center.x - pos.x) / scale, y: (center.y - pos.y) / scale };
      const targetPos = { x: center.x - anchorWorld.x * endScale, y: center.y - anchorWorld.y * endScale };
      animateViewTo(endScale, targetPos, duration);
    },
    [animateViewTo, pos.x, pos.y, scale]
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
      const oldScale = scale;
      const scaleBy = 1.05;
      const direction = evt.deltaY > 0 ? 1 : -1;
      const newScale = clamp(direction > 0 ? oldScale / scaleBy : oldScale * scaleBy, 0.1, 8);
      const anchorWorld = { x: (pointer.x - pos.x) / oldScale, y: (pointer.y - pos.y) / oldScale };
      setScale(newScale);
      setPos({ x: pointer.x - anchorWorld.x * newScale, y: pointer.y - anchorWorld.y * newScale });
      return;
    }

    // Trackpad / wheel panning
    setPos((p) => ({ x: p.x - evt.deltaX, y: p.y - evt.deltaY }));
  }, [cancelZoomAnim, height, pos.x, pos.y, scale, width]);

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
        animateZoomAt(center, scale * 1.1);
        return;
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        const center = { x: width / 2, y: height / 2 };
        animateZoomAt(center, scale / 1.1);
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
        setPos((p) => ({ x: p.x + step, y: p.y }));
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setPos((p) => ({ x: p.x - step, y: p.y }));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setPos((p) => ({ x: p.x, y: p.y + step }));
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPos((p) => ({ x: p.x, y: p.y - step }));
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
  }, [animateViewTo, animateZoomAt, height, isSpaceDown, scale, width]);

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
        setPos((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        lastPointerRef.current = p;
      }
    }
  }, [isLeftPanning, isNodeDragging]);

  const onStageDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = stageRef.current;
    if (!stage || e.target !== stage) return;
    setPos({ x: stage.x(), y: stage.y() });
  }, []);

  const cursor = isPanning ? "grabbing" : isSpaceDown ? "grab" : "default";

  // Cancel animation on unmount
  useEffect(() => cancelZoomAnim, [cancelZoomAnim]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      style={{ width: "100vw", height: "100vh", outline: "none", cursor, position: "relative" }}
      aria-label="Seating plan canvas"
      role="application"
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        x={pos.x}
        y={pos.y}
        scaleX={scale}
        scaleY={scale}
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
        <GridLayer width={width} height={height} scale={scale} offset={pos} />
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
      {/* Zoom controls */}
      <div className="absolute left-4 bottom-4 z-10 flex flex-col gap-2 select-none" aria-label="Zoom controls">
        <button
          type="button"
          onClick={() => animateZoomAt({ x: width / 2, y: height / 2 }, scale * 1.1)}
          title="Zoom in (+)"
          aria-label="Zoom in"
          className="w-10 h-10 rounded-md bg-white/90 dark:bg-black/60 border border-black/10 dark:border-white/10 shadow hover:bg-white dark:hover:bg-black text-lg leading-none"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => animateZoomAt({ x: width / 2, y: height / 2 }, scale / 1.1)}
          title="Zoom out (-)"
          aria-label="Zoom out"
          className="w-10 h-10 rounded-md bg-white/90 dark:bg-black/60 border border-black/10 dark:border-white/10 shadow hover:bg-white dark:hover:bg-black text-lg leading-none"
        >
          −
        </button>
      </div>
    </div>
  );
}
