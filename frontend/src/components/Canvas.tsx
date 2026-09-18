import { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '@/store';
import { CanvasRenderer } from '@/renderer/canvas-renderer';
import type { SceneNode } from '@shared/types';

interface DragState {
  nodeId: string;
  startX: number;
  startY: number;
  nodeStartX: number;
  nodeStartY: number;
}

interface ResizeState {
  nodeId: string;
  handle: string;
  startX: number;
  startY: number;
  nodeX: number;
  nodeY: number;
  nodeW: number;
  nodeH: number;
}

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animFrameRef = useRef<number>(0);

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const {
    document, zoom, panX, panY, activeTool,
    isDrawing, drawStart, selectedIds,
    setZoom, setPan, startDrawing, stopDrawing,
    select, setHovered, addNode, clearSelection,
    updateNode, toggleSelect,
  } = useEditorStore();

  // Init renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new CanvasRenderer(canvasRef.current);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      rendererRef.current.resize(rect.width, rect.height);
    }
  }, []);

  // Resize
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

  // Screen to world coords
  const screenToWorld = useCallback((sx: number, sy: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (sx - rect.left - panX) / zoom,
      y: (sy - rect.top - panY) / zoom,
    };
  }, [zoom, panX, panY]);

  // Hit test
  const hitTest = useCallback((sx: number, sy: number): string | null => {
    if (!rendererRef.current || !document) return null;
    return rendererRef.current.hitTest(sx, sy, document.root.children);
  }, [document]);

  // Mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (activeTool === 'hand') || (e.altKey)) {
      // Middle click or hand tool or alt+click = pan
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      return;
    }

    if (activeTool === 'select') {
      const hit = hitTest(e.clientX, e.clientY);
      if (hit) {
        if (e.shiftKey) {
          toggleSelect(hit);
        } else if (!selectedIds.has(hit)) {
          select(hit);
        }
        // Start drag
        const node = rendererRef.current && document
          ? findNode(document.root, hit) : null;
        if (node && !node.locked) {
          const world = screenToWorld(e.clientX, e.clientY);
          setDragState({
            nodeId: hit,
            startX: world.x,
            startY: world.y,
            nodeStartX: node.x,
            nodeStartY: node.y,
          });
        }
      } else {
        clearSelection();
      }
      return;
    }

    // Drawing tools
    if (['rectangle', 'ellipse', 'frame', 'text'].includes(activeTool)) {
      const world = screenToWorld(e.clientX, e.clientY);
      startDrawing(world);
    }
  }, [activeTool, panX, panY, selectedIds, hitTest, screenToWorld, select, toggleSelect, clearSelection, startDrawing, document]);

  // Mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Panning
    if (isPanning) {
      setPan(e.clientX - panStart.x, e.clientY - panStart.y);
      return;
    }

    // Dragging node
    if (dragState) {
      const world = screenToWorld(e.clientX, e.clientY);
      const dx = world.x - dragState.startX;
      const dy = world.y - dragState.startY;
      updateNode(dragState.nodeId, {
        x: dragState.nodeStartX + dx,
        y: dragState.nodeStartY + dy,
      });
      return;
    }

    // Resizing node
    if (resizeState) {
      const world = screenToWorld(e.clientX, e.clientY);
      const dx = world.x - resizeState.startX;
      const dy = world.y - resizeState.startY;
      const { handle } = resizeState;
      let newX = resizeState.nodeX;
      let newY = resizeState.nodeY;
      let newW = resizeState.nodeW;
      let newH = resizeState.nodeH;

      if (handle.includes('e')) newW = Math.max(10, resizeState.nodeW + dx);
      if (handle.includes('w')) { newW = Math.max(10, resizeState.nodeW - dx); newX = resizeState.nodeX + dx; }
      if (handle.includes('s')) newH = Math.max(10, resizeState.nodeH + dy);
      if (handle.includes('n')) { newH = Math.max(10, resizeState.nodeH - dy); newY = resizeState.nodeY + dy; }

      updateNode(resizeState.nodeId, { x: newX, y: newY, width: newW, height: newH });
      return;
    }

    // Hover
    if (activeTool === 'select' && !dragState && !resizeState) {
      const hit = hitTest(e.clientX, e.clientY);
      setHovered(hit);
    }
  }, [isPanning, panStart, dragState, resizeState, activeTool, screenToWorld, setPan, updateNode, hitTest, setHovered]);

  // Mouse up
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (dragState) {
      setDragState(null);
      return;
    }

    if (resizeState) {
      setResizeState(null);
      return;
    }

    // Finish drawing
    if (!isDrawing || !drawStart) return;

    const end = screenToWorld(e.clientX, e.clientY);
    const w = Math.abs(end.x - drawStart.x);
    const h = Math.abs(end.y - drawStart.y);

    if (w > 2 && h > 2) {
      const toolType = activeTool === 'frame' ? 'frame' : activeTool as SceneNode['type'];
      const fills = activeTool === 'frame'
        ? [{ type: 'solid' as const, visible: true, opacity: 1, color: { r: 255, g: 255, b: 255, a: 1 } }]
        : [{ type: 'solid' as const, visible: true, opacity: 1, color: { r: 99, g: 102, b: 241, a: 1 } }];

      const newNode: SceneNode = {
        id: `node_${Date.now()}`,
        name: activeTool.charAt(0).toUpperCase() + activeTool.slice(1),
        type: toolType,
        visible: true, locked: false, opacity: 1, blendMode: 'normal',
        x: Math.min(drawStart.x, end.x),
        y: Math.min(drawStart.y, end.y),
        width: w, height: h, rotation: 0,
        cornerRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
        fills, strokes: [], effects: [],
        layout: { mode: 'none', direction: 'column', wrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'stretch', gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 }, itemSpacing: 0 },
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
  }, [isPanning, dragState, resizeState, isDrawing, drawStart, zoom, panX, panY, activeTool, screenToWorld, document, addNode, select, stopDrawing]);

  // Wheel = zoom + pan (canvas only)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom toward mouse position
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = -e.deltaY * 0.002;
      const newZoom = Math.max(0.05, Math.min(20, zoom * (1 + delta)));
      const scale = newZoom / zoom;
      setPan(mx - (mx - panX) * scale, my - (my - panY) * scale);
      setZoom(newZoom);
    } else {
      setPan(panX - e.deltaX, panY - e.deltaY);
    }
  }, [zoom, panX, panY, setZoom, setPan]);

  // Resize handle start
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    const selectedId = Array.from(selectedIds)[0];
    if (!selectedId || !document) return;
    const node = findNode(document.root, selectedId);
    if (!node) return;

    const world = screenToWorld(e.clientX, e.clientY);
    setResizeState({
      nodeId: selectedId,
      handle,
      startX: world.x,
      startY: world.y,
      nodeX: node.x,
      nodeY: node.y,
      nodeW: node.width,
      nodeH: node.height,
    });
  }, [selectedIds, document, screenToWorld]);

  const cursorMap: Record<string, string> = {
    select: 'default',
    hand: 'grab',
    rectangle: 'crosshair',
    ellipse: 'crosshair',
    frame: 'crosshair',
    text: 'text',
    line: 'crosshair',
    pen: 'crosshair',
  };

  const cursor = isPanning ? 'grabbing' : dragState ? 'move' : cursorMap[activeTool] || 'default';

  // Get selected node for resize handles
  const selectedNode = selectedIds.size === 1 && document
    ? findNode(document.root, Array.from(selectedIds)[0])
    : null;

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ background: '#1a1a1a' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Selection overlay — resize handles */}
      {selectedNode && !dragState && !resizeState && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: selectedNode.x * zoom + panX,
            top: selectedNode.y * zoom + panY,
            width: selectedNode.width * zoom,
            height: selectedNode.height * zoom,
          }}
        >
          {/* Border */}
          <div className="absolute inset-0 border-2 border-koda-accent rounded-sm pointer-events-none" />

          {/* Resize handles */}
          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => {
            const size = 8;
            const style: React.CSSProperties = { width: size, height: size, position: 'absolute' };
            const cursorMap: Record<string, string> = {
              nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize', e: 'e-resize',
              se: 'se-resize', s: 's-resize', sw: 'sw-resize', w: 'w-resize',
            };

            if (handle === 'nw') { style.left = -size / 2; style.top = -size / 2; }
            else if (handle === 'n') { style.left = '50%'; style.top = -size / 2; style.transform = 'translateX(-50%)'; }
            else if (handle === 'ne') { style.right = -size / 2; style.top = -size / 2; }
            else if (handle === 'e') { style.right = -size / 2; style.top = '50%'; style.transform = 'translateY(-50%)'; }
            else if (handle === 'se') { style.right = -size / 2; style.bottom = -size / 2; }
            else if (handle === 's') { style.left = '50%'; style.bottom = -size / 2; style.transform = 'translateX(-50%)'; }
            else if (handle === 'sw') { style.left = -size / 2; style.bottom = -size / 2; }
            else if (handle === 'w') { style.left = -size / 2; style.top = '50%'; style.transform = 'translateY(-50%)'; }

            return (
              <div
                key={handle}
                className="bg-white border border-koda-accent rounded-sm pointer-events-auto"
                style={{ ...style, cursor: cursorMap[handle] }}
                onMouseDown={(e) => handleResizeStart(e, handle)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function findNode(node: SceneNode, id: string): SceneNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}
