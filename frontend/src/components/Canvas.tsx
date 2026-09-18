// ============================================================================
// Canvas Component — Bridges React UI to Renderer (WASM or TS fallback)
// ============================================================================

import { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/store';
import { CanvasRenderer } from '@/renderer/canvas-renderer';
import type { SceneNode } from '@shared/types';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animFrameRef = useRef<number>(0);

  const {
    document,
    zoom,
    panX,
    panY,
    activeTool,
    isDrawing,
    drawStart,
    setZoom,
    setPan,
    startDrawing,
    stopDrawing,
    select,
    setHovered,
    addNode,
    clearSelection,
  } = useEditorStore();

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new CanvasRenderer(canvasRef.current);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      rendererRef.current.resize(rect.width, rect.height);
    }
  }, []);

  // Resize handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        rendererRef.current?.resize(width, height);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Render loop
  useEffect(() => {
    function renderFrame() {
      if (rendererRef.current && document) {
        rendererRef.current.setViewport(zoom, panX, panY);
        rendererRef.current.render(document.root.children);
      }
      animFrameRef.current = requestAnimationFrame(renderFrame);
    }
    animFrameRef.current = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [document, zoom, panX, panY]);

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool === 'hand') return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - panX) / zoom;
      const y = (e.clientY - rect.top - panY) / zoom;

      if (['rectangle', 'ellipse', 'frame', 'text'].includes(activeTool)) {
        startDrawing({ x, y });
      } else if (activeTool === 'select') {
        if (rendererRef.current && document) {
          const hit = rendererRef.current.hitTest(
            e.clientX - rect.left,
            e.clientY - rect.top,
            document.root.children
          );
          if (hit) {
            select(hit);
          } else {
            clearSelection();
          }
        }
      }
    },
    [activeTool, zoom, panX, panY, document, startDrawing, select, clearSelection]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool === 'hand' && e.buttons === 1) {
        setPan(panX + e.movementX, panY + e.movementY);
        return;
      }

      // Hover detection
      if (rendererRef.current && document && activeTool === 'select') {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const hit = rendererRef.current.hitTest(
          e.clientX - rect.left,
          e.clientY - rect.top,
          document.root.children
        );
        setHovered(hit);
      }
    },
    [activeTool, panX, panY, document, setPan, setHovered]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || !drawStart) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const endX = (e.clientX - rect.left - panX) / zoom;
      const endY = (e.clientY - rect.top - panY) / zoom;

      const width = Math.abs(endX - drawStart.x);
      const height = Math.abs(endY - drawStart.y);

      if (width > 2 && height > 2) {
        const toolType = activeTool === 'frame' ? 'frame' : activeTool as SceneNode['type'];
        const newNode: SceneNode = {
          id: `node_${Date.now()}`,
          name: activeTool.charAt(0).toUpperCase() + activeTool.slice(1),
          type: toolType,
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          x: Math.min(drawStart.x, endX),
          y: Math.min(drawStart.y, endY),
          width,
          height,
          rotation: 0,
          cornerRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
          fills: [{ type: 'solid', visible: true, opacity: 1, color: { r: 99, g: 102, b: 241, a: 1 } }],
          strokes: [],
          effects: [],
          layout: {
            mode: 'none', direction: 'column', wrap: 'nowrap',
            justifyContent: 'flex-start', alignItems: 'stretch',
            gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 }, itemSpacing: 0,
          },
          sizeConstraint: { widthSizing: 'fixed', heightSizing: 'fixed' },
          constraints: { horizontal: 'left', vertical: 'top' },
          children: [],
        };

        if (document?.root.children[0]) {
          addNode(document.root.children[0].id, newNode);
          select(newNode.id);
        }
      }

      stopDrawing();
    },
    [isDrawing, drawStart, zoom, panX, panY, activeTool, document, addNode, stopDrawing, select]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const delta = -e.deltaY * 0.01;
        setZoom(zoom + delta);
      } else {
        setPan(panX - e.deltaX, panY - e.deltaY);
      }
    },
    [zoom, panX, panY, setZoom, setPan]
  );

  const cursorStyle =
    activeTool === 'hand' ? 'grab' :
    activeTool === 'select' ? 'default' : 'crosshair';

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-koda-bg">
      <canvas
        ref={canvasRef}
        id="koda-canvas"
        className="absolute inset-0"
        style={{ cursor: cursorStyle }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-koda-surface/80 backdrop-blur-sm border border-koda-border rounded-lg px-3 py-1.5 text-xs text-koda-text-secondary font-mono">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
