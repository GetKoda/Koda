// ============================================================================
// Koda Scene Graph — Core Document Model
//
// This is the single source of truth for everything in the editor.
// All tools, rendering, and codegen read/write this model.
// ============================================================================

// ── Node Types ──────────────────────────────────────────────────────────────

export type NodeType =
  | 'canvas'      // Root document node
  | 'frame'       // Container with auto-layout
  | 'group'       // Simple grouping
  | 'rectangle'
  | 'ellipse'
  | 'polygon'
  | 'star'
  | 'line'
  | 'vector'      // Pen tool path
  | 'text'
  | 'image'
  | 'component'   // Component definition
  | 'instance';   // Instance of a component

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten' | 'color-dodge' | 'color-burn'
  | 'hard-light' | 'soft-light' | 'difference' | 'exclusion'
  | 'hue' | 'saturation' | 'color' | 'luminosity';

// ── Geometry ────────────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Transform {
  a: number; b: number; c: number; d: number; e: number; f: number;
}

// ── Styling ─────────────────────────────────────────────────────────────────

export interface Color {
  r: number;   // 0-255
  g: number;   // 0-255
  b: number;   // 0-255
  a: number;   // 0-1
  hex?: string;
  tokenRef?: string;
}

export interface GradientStop {
  position: number;  // 0-1
  color: Color;
}

export interface Fill {
  type: 'solid' | 'linear-gradient' | 'radial-gradient' | 'image';
  visible: boolean;
  opacity: number;
  color?: Color;
  gradientStops?: GradientStop[];
  gradientAngle?: number;
  imageUrl?: string;
  imageFit?: 'fill' | 'contain' | 'cover' | 'tile';
}

export interface Stroke {
  visible: boolean;
  color: Color;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  align: 'inside' | 'center' | 'outside';
}

export type EffectType = 'drop-shadow' | 'inner-shadow' | 'blur' | 'layer-blur';

export interface Effect {
  type: EffectType;
  visible: boolean;
  color?: Color;
  offset?: Point;
  blur: number;
  spread?: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;       // 100-900
  lineHeight: number;       // multiplier or px
  letterSpacing: number;    // px
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textCase: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration: 'none' | 'underline' | 'line-through';
  color: Color;
}

// ── Layout ──────────────────────────────────────────────────────────────────

export type LayoutMode = 'none' | 'flex' | 'grid';
export type FlexDirection = 'row' | 'column';
export type FlexWrap = 'nowrap' | 'wrap';
export type JustifyContent = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
export type AlignItems = 'flex-start' | 'center' | 'flex-end' | 'stretch';
export type LayoutSizing = 'fixed' | 'hug' | 'fill';

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface LayoutProps {
  mode: LayoutMode;
  direction: FlexDirection;
  wrap: FlexWrap;
  justifyContent: JustifyContent;
  alignItems: AlignItems;
  gap: number;
  padding: Padding;
  itemSpacing: number;
}

export interface SizeConstraint {
  widthSizing: LayoutSizing;
  heightSizing: LayoutSizing;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

// ── Constraints ─────────────────────────────────────────────────────────────

export type HorizontalConstraint = 'left' | 'right' | 'center' | 'left-right' | 'scale';
export type VerticalConstraint = 'top' | 'bottom' | 'center' | 'top-bottom' | 'scale';

export interface Constraints {
  horizontal: HorizontalConstraint;
  vertical: VerticalConstraint;
}

// ── Corner Radius ───────────────────────────────────────────────────────────

export interface CornerRadius {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

// ── Scene Node ──────────────────────────────────────────────────────────────

export interface SceneNode {
  id: string;
  name: string;
  type: NodeType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;

  // Geometry
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;          // degrees
  cornerRadius: CornerRadius;

  // Styling
  fills: Fill[];
  strokes: Stroke[];
  effects: Effect[];

  // Layout (for frame nodes)
  layout: LayoutProps;
  sizeConstraint: SizeConstraint;
  constraints: Constraints;

  // Text
  textContent?: string;
  textStyle?: TextStyle;

  // Component
  componentId?: string;      // For instances: parent component ID
  overrides?: Record<string, unknown>;

  // Children
  children: SceneNode[];

  // Parent reference (not serialized, maintained in memory)
  parentId?: string;
}

// ── Document ────────────────────────────────────────────────────────────────

export interface KodaDocument {
  id: string;
  name: string;
  version: string;
  root: SceneNode;           // Canvas node containing all pages
  components: SceneNode[];   // Component definitions
  createdAt: string;
  updatedAt: string;
}
