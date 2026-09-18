// ============================================================================
// Koda Editor State — Zustand Store
//
// Central state for the entire editor. All tools and UI read/write here.
// ============================================================================

import { create } from 'zustand';
import type { SceneNode, KodaDocument, Point } from '@shared/types';

// ── Tool Types ──────────────────────────────────────────────────────────────

export type Tool =
  | 'select'
  | 'frame'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'pen'
  | 'text'
  | 'hand';

// ── Editor State ────────────────────────────────────────────────────────────

export interface EditorState {
  // Document
  document: KodaDocument | null;

  // Selection
  selectedIds: Set<string>;
  hoveredId: string | null;

  // Tool
  activeTool: Tool;

  // Viewport
  zoom: number;
  panX: number;
  panY: number;

  // UI
  showLayers: boolean;
  showProperties: boolean;
  showCodegen: boolean;

  // Drawing state (while actively drawing)
  isDrawing: boolean;
  drawStart: Point | null;

  // ── Actions ──

  // Document
  setDocument: (doc: KodaDocument) => void;
  getNodeById: (id: string) => SceneNode | null;

  // Selection
  select: (id: string) => void;
  selectMultiple: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;

  // Tool
  setTool: (tool: Tool) => void;

  // Viewport
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  zoomToFit: () => void;

  // Node operations
  addNode: (parentId: string, node: SceneNode) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<SceneNode>) => void;
  moveNode: (id: string, parentId: string) => void;

  // Drawing
  startDrawing: (point: Point) => void;
  stopDrawing: () => void;

  // UI
  toggleLayers: () => void;
  toggleProperties: () => void;
  toggleCodegen: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function findNodeById(node: SceneNode, id: string): SceneNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

function removeNodeFromTree(node: SceneNode, id: string): SceneNode {
  return {
    ...node,
    children: node.children
      .filter((c) => c.id !== id)
      .map((c) => removeNodeFromTree(c, id)),
  };
}

function updateNodeInTree(node: SceneNode, id: string, updates: Partial<SceneNode>): SceneNode {
  if (node.id === id) {
    return { ...node, ...updates };
  }
  return {
    ...node,
    children: node.children.map((c) => updateNodeInTree(c, id, updates)),
  };
}

function addToParent(node: SceneNode, parentId: string, child: SceneNode): SceneNode {
  if (node.id === parentId) {
    return { ...node, children: [...node.children, { ...child, parentId }] };
  }
  return {
    ...node,
    children: node.children.map((c) => addToParent(c, parentId, child)),
  };
}

let nodeIdCounter = 0;
export function generateId(): string {
  return `node_${Date.now()}_${++nodeIdCounter}`;
}

// ── Default Node ────────────────────────────────────────────────────────────

export function createDefaultNode(type: SceneNode['type'], overrides?: Partial<SceneNode>): SceneNode {
  return {
    id: generateId(),
    name: type.charAt(0).toUpperCase() + type.slice(1),
    type,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: 'normal',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    cornerRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
    fills: [],
    strokes: [],
    effects: [],
    layout: {
      mode: 'none',
      direction: 'column',
      wrap: 'nowrap',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      gap: 0,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      itemSpacing: 0,
    },
    sizeConstraint: { widthSizing: 'fixed', heightSizing: 'fixed' },
    constraints: { horizontal: 'left', vertical: 'top' },
    children: [],
    ...overrides,
  };
}

// ── Store ───────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  document: null,
  selectedIds: new Set(),
  hoveredId: null,
  activeTool: 'select',
  zoom: 1,
  panX: 0,
  panY: 0,
  showLayers: true,
  showProperties: true,
  showCodegen: false,
  isDrawing: false,
  drawStart: null,

  // Document
  setDocument: (doc) => set({ document: doc }),

  getNodeById: (id) => {
    const doc = get().document;
    if (!doc) return null;
    return findNodeById(doc.root, id);
  },

  // Selection
  select: (id) => set({ selectedIds: new Set([id]) }),
  selectMultiple: (ids) => set({ selectedIds: new Set(ids) }),
  toggleSelect: (id) => {
    const current = get().selectedIds;
    const next = new Set(current);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ selectedIds: next });
  },
  clearSelection: () => set({ selectedIds: new Set() }),
  setHovered: (id) => set({ hoveredId: id }),

  // Tool
  setTool: (tool) => set({ activeTool: tool }),

  // Viewport
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  zoomToFit: () => set({ zoom: 1, panX: 0, panY: 0 }),

  // Node operations
  addNode: (parentId, node) => {
    const doc = get().document;
    if (!doc) return;
    set({
      document: {
        ...doc,
        root: addToParent(doc.root, parentId, node),
      },
    });
  },

  removeNode: (id) => {
    const doc = get().document;
    if (!doc) return;
    set({
      document: {
        ...doc,
        root: removeNodeFromTree(doc.root, id),
      },
      selectedIds: (() => {
        const next = new Set(get().selectedIds);
        next.delete(id);
        return next;
      })(),
    });
  },

  updateNode: (id, updates) => {
    const doc = get().document;
    if (!doc) return;
    set({
      document: {
        ...doc,
        root: updateNodeInTree(doc.root, id, updates),
      },
    });
  },

  moveNode: (id, newParentId) => {
    const doc = get().document;
    if (!doc) return;
    const node = findNodeById(doc.root, id);
    if (!node) return;
    let updated = removeNodeFromTree(doc.root, id);
    updated = addToParent(updated, newParentId, node);
    set({ document: { ...doc, root: updated } });
  },

  // Drawing
  startDrawing: (point) => set({ isDrawing: true, drawStart: point }),
  stopDrawing: () => set({ isDrawing: false, drawStart: null }),

  // UI
  toggleLayers: () => set((s) => ({ showLayers: !s.showLayers })),
  toggleProperties: () => set((s) => ({ showProperties: !s.showProperties })),
  toggleCodegen: () => set((s) => ({ showCodegen: !s.showCodegen })),
}));
