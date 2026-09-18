// ============================================================================
// Design Token System
//
// Tokens are named design values (colors, spacing, typography) that
// components reference instead of hardcoding. This is what makes
// codegen output token-aware, not flat CSS.
// ============================================================================

import type { Color } from '@shared/types';

export type TokenCategory = 'color' | 'spacing' | 'typography' | 'shadow' | 'border' | 'breakpoint';

export interface DesignToken {
  id: string;
  name: string;
  category: TokenCategory;
  value: TokenValue;
  description?: string;
  group?: string;
}

export type TokenValue = ColorToken | SpacingToken | TypographyToken | ShadowToken | BorderToken;

export interface ColorToken {
  type: 'color';
  color: Color;
  hex: string;
}

export interface SpacingToken {
  type: 'spacing';
  value: number;
  unit: 'px' | 'rem' | 'em';
}

export interface TypographyToken {
  type: 'typography';
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
}

export interface ShadowToken {
  type: 'shadow';
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: Color;
}

export interface BorderToken {
  type: 'border';
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  color: Color;
  radius: number;
}

export interface TokenSet {
  tokens: DesignToken[];
  groups: string[];
}

// ── Token Store ─────────────────────────────────────────────────────────────

export class TokenManager {
  private tokens: Map<string, DesignToken> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadDefaults();
  }

  // Get all tokens
  getAll(): DesignToken[] {
    return Array.from(this.tokens.values());
  }

  // Get tokens by category
  getByCategory(category: TokenCategory): DesignToken[] {
    return this.getAll().filter((t) => t.category === category);
  }

  // Get token by ID
  get(id: string): DesignToken | undefined {
    return this.tokens.get(id);
  }

  // Get token by name (e.g., "primary-500")
  getByName(name: string): DesignToken | undefined {
    return this.getAll().find((t) => t.name === name);
  }

  // Add or update token
  set(token: DesignToken): void {
    this.tokens.set(token.id, token);
    this.notify();
  }

  // Remove token
  remove(id: string): void {
    this.tokens.delete(id);
    this.notify();
  }

  // Resolve a token reference to its value
  resolve(value: string | undefined): string | undefined {
    if (!value?.startsWith('token:')) return value;
    const tokenId = value.slice(6);
    const token = this.tokens.get(tokenId);
    if (!token) return undefined;

    const v = token.value;
    switch (v.type) {
      case 'color': return v.hex;
      case 'spacing': return `${v.value}${v.unit}`;
      case 'typography': return `${v.fontWeight} ${v.fontSize}px/${v.lineHeight} ${v.fontFamily}`;
      default: return undefined;
    }
  }

  // Extract tokens from a scene node's styles
  extractFromNode(node: { fills?: any[]; textStyle?: any; effects?: any[] }): DesignToken[] {
    const extracted: DesignToken[] = [];

    // Extract colors from fills
    if (node.fills) {
      for (const fill of node.fills) {
        if (fill.color?.hex) {
          const existing = this.findColorByHex(fill.color.hex);
          if (existing) {
            extracted.push(existing);
          } else {
            // Create new token
            const token: DesignToken = {
              id: `color_${fill.color.hex.replace('#', '')}`,
              name: this.generateColorName(fill.color.hex),
              category: 'color',
              value: { type: 'color', color: fill.color, hex: fill.color.hex },
            };
            this.set(token);
            extracted.push(token);
          }
        }
      }
    }

    // Extract typography
    if (node.textStyle) {
      const ts = node.textStyle;
      const token: DesignToken = {
        id: `typo_${ts.fontFamily}_${ts.fontSize}_${ts.fontWeight}`,
        name: `${ts.fontFamily}-${ts.fontSize}-${ts.fontWeight}`,
        category: 'typography',
        value: {
          type: 'typography',
          fontFamily: ts.fontFamily,
          fontSize: ts.fontSize,
          fontWeight: ts.fontWeight,
          lineHeight: ts.lineHeight,
          letterSpacing: ts.letterSpacing,
        },
      };
      this.set(token);
      extracted.push(token);
    }

    return extracted;
  }

  // Subscribe to changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Export as JSON (for codegen)
  export(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const token of this.tokens.values()) {
      const group = token.group || token.category;
      if (!result[group]) result[group] = {};
      const v = token.value;
      switch (v.type) {
        case 'color':
          result[group][token.name] = v.hex;
          break;
        case 'spacing':
          result[group][token.name] = `${v.value}${v.unit}`;
          break;
        case 'typography':
          result[group][token.name] = {
            fontFamily: v.fontFamily,
            fontSize: `${v.fontSize}px`,
            fontWeight: v.fontWeight,
            lineHeight: v.lineHeight,
            letterSpacing: v.letterSpacing,
          };
          break;
      }
    }
    return result;
  }

  // ── Private ──

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  private findColorByHex(hex: string): DesignToken | undefined {
    return this.getAll().find(
      (t) => t.category === 'color' && (t.value as ColorToken).hex === hex
    );
  }

  private generateColorName(hex: string): string {
    // Simple heuristic for color naming
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    if (r > 200 && g < 100 && b < 100) return 'red';
    if (r < 100 && g > 200 && b < 100) return 'green';
    if (r < 100 && g < 100 && b > 200) return 'blue';
    if (r > 200 && g > 200 && b < 100) return 'yellow';
    if (r > 200 && g < 100 && b > 200) return 'purple';
    if (r < 100 && g > 200 && b > 200) return 'cyan';
    if (r > 200 && g > 200 && b > 200) return 'white';
    if (r < 50 && g < 50 && b < 50) return 'black';
    if (r > 100 && g > 100 && b > 100) return 'gray';
    return `color-${hex.replace('#', '')}`;
  }

  private loadDefaults(): void {
    // Default Koda color palette
    const defaults: DesignToken[] = [
      { id: 'color-primary', name: 'primary', category: 'color', value: { type: 'color', color: { r: 99, g: 102, b: 241, a: 1 }, hex: '#6366f1' }, group: 'brand' },
      { id: 'color-primary-hover', name: 'primary-hover', category: 'color', value: { type: 'color', color: { r: 129, g: 140, b: 248, a: 1 }, hex: '#818cf8' }, group: 'brand' },
      { id: 'color-success', name: 'success', category: 'color', value: { type: 'color', color: { r: 34, g: 197, b: 94, a: 1 }, hex: '#22c55e' }, group: 'semantic' },
      { id: 'color-warning', name: 'warning', category: 'color', value: { type: 'color', color: { r: 234, g: 179, b: 8, a: 1 }, hex: '#eab308' }, group: 'semantic' },
      { id: 'color-error', name: 'error', category: 'color', value: { type: 'color', color: { r: 239, g: 68, b: 68, a: 1 }, hex: '#ef4444' }, group: 'semantic' },
      { id: 'color-bg', name: 'background', category: 'color', value: { type: 'color', color: { r: 255, g: 255, b: 255, a: 1 }, hex: '#ffffff' }, group: 'surface' },
      { id: 'color-surface', name: 'surface', category: 'color', value: { type: 'color', color: { r: 245, g: 245, b: 245, a: 1 }, hex: '#f5f5f5' }, group: 'surface' },
      { id: 'color-text', name: 'text-primary', category: 'color', value: { type: 'color', color: { r: 23, g: 23, b: 23, a: 1 }, hex: '#171717' }, group: 'text' },
      { id: 'color-text-secondary', name: 'text-secondary', category: 'color', value: { type: 'color', color: { r: 115, g: 115, b: 115, a: 1 }, hex: '#737373' }, group: 'text' },
      { id: 'color-border', name: 'border', category: 'color', value: { type: 'color', color: { r: 229, g: 229, b: 229, a: 1 }, hex: '#e5e5e5' }, group: 'border' },

      // Spacing scale
      { id: 'spacing-0', name: '0', category: 'spacing', value: { type: 'spacing', value: 0, unit: 'px' }, group: 'spacing' },
      { id: 'spacing-1', name: '1', category: 'spacing', value: { type: 'spacing', value: 4, unit: 'px' }, group: 'spacing' },
      { id: 'spacing-2', name: '2', category: 'spacing', value: { type: 'spacing', value: 8, unit: 'px' }, group: 'spacing' },
      { id: 'spacing-3', name: '3', category: 'spacing', value: { type: 'spacing', value: 12, unit: 'px' }, group: 'spacing' },
      { id: 'spacing-4', name: '4', category: 'spacing', value: { type: 'spacing', value: 16, unit: 'px' }, group: 'spacing' },
      { id: 'spacing-6', name: '6', category: 'spacing', value: { type: 'spacing', value: 24, unit: 'px' }, group: 'spacing' },
      { id: 'spacing-8', name: '8', category: 'spacing', value: { type: 'spacing', value: 32, unit: 'px' }, group: 'spacing' },

      // Typography scale
      { id: 'typo-heading-lg', name: 'heading-lg', category: 'typography', value: { type: 'typography', fontFamily: 'Inter', fontSize: 30, fontWeight: 700, lineHeight: 1.2, letterSpacing: -0.02 }, group: 'typography' },
      { id: 'typo-heading-md', name: 'heading-md', category: 'typography', value: { type: 'typography', fontFamily: 'Inter', fontSize: 24, fontWeight: 600, lineHeight: 1.3, letterSpacing: -0.01 }, group: 'typography' },
      { id: 'typo-heading-sm', name: 'heading-sm', category: 'typography', value: { type: 'typography', fontFamily: 'Inter', fontSize: 18, fontWeight: 600, lineHeight: 1.4, letterSpacing: 0 }, group: 'typography' },
      { id: 'typo-body-lg', name: 'body-lg', category: 'typography', value: { type: 'typography', fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 }, group: 'typography' },
      { id: 'typo-body-md', name: 'body-md', category: 'typography', value: { type: 'typography', fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 }, group: 'typography' },
      { id: 'typo-body-sm', name: 'body-sm', category: 'typography', value: { type: 'typography', fontFamily: 'Inter', fontSize: 12, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 }, group: 'typography' },
      { id: 'typo-caption', name: 'caption', category: 'typography', value: { type: 'typography', fontFamily: 'Inter', fontSize: 10, fontWeight: 400, lineHeight: 1.4, letterSpacing: 0.01 }, group: 'typography' },
    ];

    defaults.forEach((t) => this.tokens.set(t.id, t));
  }
}

// Singleton
export const tokenManager = new TokenManager();
