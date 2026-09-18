// ============================================================================
// Codegen Data Contract
//
// This is the spec that determines codegen quality. The editor sends
// this exact structure to koda-ai. Versioned — mismatch = hard error.
// ============================================================================

export const CONTRACT_VERSION = '1.0.0';

// ── Codegen Request ─────────────────────────────────────────────────────────

export interface CodegenRequest {
  contractVersion: string;
  timestamp: string;

  // The selected frame/component to generate code for
  frame: CodegenFrame;

  // Full component definitions used by this frame
  components: CodegenComponent[];

  // Resolved design tokens (not raw values)
  tokens: Record<string, Record<string, any>>;

  // Target framework + output format
  options: CodegenOptions;
}

export interface CodegenFrame {
  id: string;
  name: string;
  width: number;
  height: number;
  nodeTree: CodegenNode;
}

export interface CodegenNode {
  id: string;
  type: string;
  name: string;

  // Geometry
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;

  // Styling (resolved values + token refs where available)
  fills: CodegenFill[];
  strokes: CodegenStroke[];
  effects: CodegenEffect[];
  cornerRadius: { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number };

  // Text
  textContent?: string;
  textStyle?: CodegenTextStyle;

  // Layout
  layout: {
    mode: string;
    direction: string;
    justifyContent: string;
    alignItems: string;
    gap: number;
    padding: { top: number; right: number; bottom: number; left: number };
  };

  // Component reference
  componentId?: string;
  overrides?: Record<string, unknown>;
  isInstance?: boolean;

  // Semantic hints (for code quality)
  semanticRole?: string;
  ariaLabel?: string;

  // Children
  children: CodegenNode[];
}

export interface CodegenFill {
  type: string;
  visible: boolean;
  opacity: number;
  color?: { r: number; g: number; b: number; a: number; hex?: string; tokenRef?: string };
  gradientStops?: Array<{ position: number; color: { r: number; g: number; b: number; a: number } }>;
  gradientAngle?: number;
}

export interface CodegenStroke {
  visible: boolean;
  color: { r: number; g: number; b: number; a: number; tokenRef?: string };
  width: number;
  style: string;
  align: string;
}

export interface CodegenEffect {
  type: string;
  visible: boolean;
  color?: { r: number; g: number; b: number; a: number };
  offset?: { x: number; y: number };
  blur: number;
  spread?: number;
}

export interface CodegenTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textAlign: string;
  color?: { r: number; g: number; b: number; a: number; tokenRef?: string };
}

export interface CodegenComponent {
  id: string;
  name: string;
  description?: string;
  root: CodegenNode;
  variants?: Array<{
    name: string;
    properties: Record<string, unknown>;
  }>;
}

// ── Codegen Options ─────────────────────────────────────────────────────────

export type Framework = 'react' | 'vue' | 'html-css';
export type CssFramework = 'tailwind' | 'css-modules' | 'scss' | 'vanilla';

export interface CodegenOptions {
  framework: Framework;
  cssFramework: CssFramework;
  typescript: boolean;
  componentPrefix?: string;
  accessibility: boolean;
  responsive: boolean;
  darkMode: boolean;
}

// ── Codegen Response ────────────────────────────────────────────────────────

export interface CodegenResponse {
  success: boolean;
  requestId?: string;
  files: CodegenFile[];
  stats: {
    totalFiles: number;
    totalLines: number;
    generationTime: number;
    componentsGenerated: number;
    tokensExtracted: number;
  };
}

export interface CodegenFile {
  path: string;
  content: string;
  language: string;
  type: 'component' | 'style' | 'config' | 'util' | 'type' | 'entry';
}

// ── Chat Design Operation ───────────────────────────────────────────────────

export interface DesignOperation {
  type: 'create' | 'update' | 'delete' | 'move';
  target: string;           // node ID or path
  payload: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  operations?: DesignOperation[];
  designs?: any[];
}
