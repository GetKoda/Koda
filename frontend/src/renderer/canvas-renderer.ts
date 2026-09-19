// ============================================================================
// Canvas Renderer — Pure TypeScript Fallback
//
// Used when WASM renderer is not available. Same API, slower performance.
// ============================================================================

import type { SceneNode, CornerRadius } from '@shared/types';

export interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
  width: number;
  height: number;
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private viewport: Viewport;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.viewport = { zoom: 1, panX: 0, panY: 0, width: 0, height: 0 };
  }

  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);
    this.viewport.width = width;
    this.viewport.height = height;
  }

  setViewport(zoom: number, panX: number, panY: number): void {
    this.viewport.zoom = zoom;
    this.viewport.panX = panX;
    this.viewport.panY = panY;
  }

  render(nodes: SceneNode[], canvasColor?: string, dotColor?: string): void {
    const ctx = this.ctx;
    const { width, height } = this.viewport;

    // Use provided canvasColor or fallback to CSS variable
    const style = getComputedStyle(document.documentElement);
    const canvasBg = canvasColor || style.getPropertyValue('--koda-canvas-bg').trim() || '#1a1a1a';
    const dots = dotColor || style.getPropertyValue('--koda-dot').trim() || '#2a2a2a';

    // Clear with canvas background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, width, height);

    // Apply viewport
    ctx.save();
    ctx.translate(this.viewport.panX, this.viewport.panY);
    ctx.scale(this.viewport.zoom, this.viewport.zoom);

    // Draw dot grid (only when zoomed in enough)
    if (this.viewport.zoom > 0.3) {
      this.drawDotGrid(dots);
    }

    // Render nodes
    for (const node of nodes) {
      this.renderNode(node);
    }

    ctx.restore();
  }

  hitTest(screenX: number, screenY: number, nodes: SceneNode[]): string | null {
    const worldX = (screenX - this.viewport.panX) / this.viewport.zoom;
    const worldY = (screenY - this.viewport.panY) / this.viewport.zoom;

    // Test in reverse (top-most first)
    for (let i = nodes.length - 1; i >= 0; i--) {
      const hit = this.hitTestNode(nodes[i], worldX, worldY);
      if (hit) return hit;
    }
    return null;
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private drawDotGrid(dotColor: string = '#2a2a2a'): void {
    const ctx = this.ctx;
    const spacing = 20;
    const dotSize = 1;

    // Calculate visible area in world coords
    const startX = Math.floor(-this.viewport.panX / this.viewport.zoom / spacing) * spacing;
    const startY = Math.floor(-this.viewport.panY / this.viewport.zoom / spacing) * spacing;
    const endX = startX + this.viewport.width / this.viewport.zoom + spacing * 2;
    const endY = startY + this.viewport.height / this.viewport.zoom + spacing * 2;

    ctx.fillStyle = dotColor;

    for (let x = startX; x < endX; x += spacing) {
      for (let y = startY; y < endY; y += spacing) {
        ctx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
      }
    }
  }

  private renderNode(node: SceneNode): void {
    if (!node.visible) return;

    const ctx = this.ctx;
    ctx.save();

    // Opacity
    ctx.globalAlpha = node.opacity;

    // Transform
    ctx.translate(node.x + node.width / 2, node.y + node.height / 2);
    if (node.rotation) {
      ctx.rotate((node.rotation * Math.PI) / 180);
    }
    ctx.translate(-node.width / 2, -node.height / 2);

    // Draw by type
    switch (node.type) {
      case 'rectangle':
      case 'frame':
        this.drawRectangle(node);
        break;
      case 'ellipse':
        this.drawEllipse(node);
        break;
      case 'text':
        this.drawText(node);
        break;
    }

    // Selection highlight
    // (handled by React overlay)

    // Children
    for (const child of node.children) {
      this.renderNode(child);
    }

    ctx.restore();
  }

  private drawRectangle(node: SceneNode): void {
    const ctx = this.ctx;
    const { fills, strokes, cornerRadius: r, width, height } = node;

    // Fills
    for (const fill of fills) {
      if (!fill.visible) continue;
      ctx.fillStyle = this.colorToRgba(fill.color, fill.opacity);

      const hasRadius = r.topLeft > 0 || r.topRight > 0 || r.bottomRight > 0 || r.bottomLeft > 0;

      if (hasRadius) {
        this.roundedRect(0, 0, width, height, r);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, width, height);
      }
    }

    // Strokes
    for (const stroke of strokes) {
      if (!stroke.visible) continue;
      ctx.strokeStyle = this.colorToRgba(stroke.color, 1);
      ctx.lineWidth = stroke.width;

      const hasRadius = r.topLeft > 0 || r.topRight > 0 || r.bottomRight > 0 || r.bottomLeft > 0;
      if (hasRadius) {
        this.roundedRect(0, 0, width, height, r);
        ctx.stroke();
      } else {
        ctx.strokeRect(0, 0, width, height);
      }
    }
  }

  private drawEllipse(node: SceneNode): void {
    const ctx = this.ctx;
    const cx = node.width / 2;
    const cy = node.height / 2;

    ctx.beginPath();
    ctx.ellipse(cx, cy, cx, cy, 0, 0, Math.PI * 2);

    for (const fill of node.fills) {
      if (!fill.visible) continue;
      ctx.fillStyle = this.colorToRgba(fill.color, fill.opacity);
      ctx.fill();
    }
  }

  private drawText(node: SceneNode): void {
    const ctx = this.ctx;
    if (!node.textContent) return;

    const style = node.textStyle;
    const fontSize = style?.fontSize || 14;
    const fontFamily = style?.fontFamily || 'Inter, sans-serif';
    const fontWeight = style?.fontWeight || 400;

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = this.colorToRgba(style?.color, 1);
    ctx.textBaseline = 'top';
    ctx.fillText(node.textContent, 0, 0);
  }

  private roundedRect(x: number, y: number, w: number, h: number, r: CornerRadius): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r.topLeft, y);
    ctx.lineTo(x + w - r.topRight, y);
    ctx.arcTo(x + w, y, x + w, y + r.topRight, r.topRight);
    ctx.lineTo(x + w, y + h - r.bottomRight);
    ctx.arcTo(x + w, y + h, x + w - r.bottomRight, y + h, r.bottomRight);
    ctx.lineTo(x + r.bottomLeft, y + h);
    ctx.arcTo(x, y + h, x, y + h - r.bottomLeft, r.bottomLeft);
    ctx.lineTo(x, y + r.topLeft);
    ctx.arcTo(x, y, x + r.topLeft, y, r.topLeft);
    ctx.closePath();
  }

  private colorToRgba(color: { r: number; g: number; b: number; a: number } | undefined, opacity: number): string {
    if (!color) return 'rgba(0,0,0,1)';
    return `rgba(${Math.round(color.r)},${Math.round(color.g)},${Math.round(color.b)},${color.a * opacity})`;
  }

  private hitTestNode(node: SceneNode, wx: number, wy: number): string | null {
    if (!node.visible) return null;

    // Children first (top-most)
    for (let i = node.children.length - 1; i >= 0; i--) {
      const hit = this.hitTestNode(node.children[i], wx, wy);
      if (hit) return hit;
    }

    // This node
    if (wx >= node.x && wx <= node.x + node.width && wy >= node.y && wy <= node.y + node.height) {
      return node.id;
    }

    return null;
  }
}
