import { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '@/store';
import { CanvasRenderer } from '@/renderer/canvas-renderer';
import type { SceneNode } from '@shared/types';
import { ContextMenu } from './ContextMenu';

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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) {
          for (const id of selectedIds) {
            useEditorStore.getState().removeNode(id);
          }
        }
      }

      // Ctrl+D = Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (!document || selectedIds.size === 0) return;
        const newIds: string[] = [];
        for (const id of selectedIds) {
          const node = findNode(document.root, id);
          if (!node) continue;
          const clone = JSON.parse(JSON.stringify(node));
          clone.id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          clone.name = `${node.name} Copy`;
          clone.x += 20;
          clone.y += 20;
          useEditorStore.getState().addNode(node.parentId || document.root.id, clone);
          newIds.push(clone.id);
        }
        useEditorStore.getState().selectMultiple(newIds);
      }

      // Ctrl+A = Select All
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (!document) return;
        const ids: string[] = [];
        const walk = (n: SceneNode) => { ids.push(n.id); n.children.forEach(walk); };
        walk(document.root);
        useEditorStore.getState().selectMultiple(ids);
      }

      // H = Toggle visibility
      if (e.key === 'h' && !e.ctrlKey && !e.metaKey && selectedIds.size === 1) {
        const id = Array.from(selectedIds)[0];
        const node = document ? findNode(document.root, id) : null;
        if (node) useEditorStore.getState().updateNode(id, { visible: !node.visible });
      }

      // L = Toggle lock
      if (e.key === 'l' && !e.ctrlKey && !e.metaKey && selectedIds.size === 1) {
        const id = Array.from(selectedIds)[0];
        const node = document ? findNode(document.root, id) : null;
        if (node) useEditorStore.getState().updateNode(id, { locked: !node.locked });
      }

      // Ctrl+G = Group into frame
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        // Trigger grouping — same as context menu action
        if (selectedIds.size > 1) {
          const ids = Array.from(selectedIds);
          const nodes = ids.map((id) => document ? findNode(document.root, id) : null).filter(Boolean);
          if (nodes.length < 2 || !document) return;

          const minX = Math.min(...nodes.map((n: any) => n.x));
          const minY = Math.min(...nodes.map((n: any) => n.y));

          const frameNode: SceneNode = {
            id: `node_${Date.now()}`,
            name: 'Group',
            type: 'frame',
            visible: true, locked: false, opacity: 1, blendMode: 'normal',
            x: minX, y: minY, width: 200, height: 200, rotation: 0,
            cornerRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
            fills: [{ type: 'solid', visible: true, opacity: 0.05, color: { r: 255, g: 255, b: 255, a: 1 } }],
            strokes: [{ visible: true, color: { r: 255, g: 255, b: 255, a: 1 }, width: 1, style: 'solid', align: 'inside' }],
            effects: [],
            layout: { mode: 'none', direction: 'column', wrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'stretch', gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 }, itemSpacing: 0 },
            sizeConstraint: { widthSizing: 'fixed', heightSizing: 'fixed' },
            constraints: { horizontal: 'left', vertical: 'top' },
            children: [],
            parentId: document.root.id,
          };

          const maxX = Math.max(...nodes.map((n: any) => n.x + n.width));
          const maxY = Math.max(...nodes.map((n: any) => n.y + n.height));
          frameNode.width = maxX - minX + 40;
          frameNode.height = maxY - minY + 40;

          let root = document.root;
          for (const n of nodes) {
            if (!n) continue;
            const relNode = { ...n, x: n.x - minX, y: n.y - minY, parentId: frameNode.id };
            frameNode.children.push(relNode as SceneNode);
            const remove = (node: SceneNode): SceneNode => ({
              ...node,
              children: node.children.filter((c) => c.id !== n!.id).map(remove),
            });
            root = remove(root);
          }

          const addFrame = (n: SceneNode): SceneNode => {
            if (n.id === root.id) return { ...n, children: [...n.children, frameNode] };
            return { ...n, children: n.children.map(addFrame) };
          };
          root = addFrame(root);

          useEditorStore.setState({
            document: { ...document, root },
            selectedIds: new Set([frameNode.id]),
          });
        }
      }

      // Escape = Clear selection
      if (e.key === 'Escape') {
        useEditorStore.getState().clearSelection();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIds, document]);

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
        onContextMenu={(e) => {
          e.preventDefault();
          // Right-click: if no node under cursor, select on hover first
          if (activeTool === 'select') {
            const hit = hitTest(e.clientX, e.clientY);
            if (hit && !selectedIds.has(hit)) {
              select(hit);
            }
          }
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
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

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
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
