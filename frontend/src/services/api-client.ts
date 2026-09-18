// ============================================================================
// Koda API Client
//
// Unified client for all backend services:
// - koda-api (gateway)
// - koda-ai (codegen)
// - koda-chat (conversational editing)
// ============================================================================

import type {
  CodegenRequest,
  CodegenResponse,
  ChatMessage,
} from './types';
import type { KodaDocument, SceneNode } from '@shared/types';
import { tokenManager } from '@/tokens/token-manager';

const DEFAULT_API_URL = 'http://localhost:3003';
const DEFAULT_AI_URL = 'http://localhost:3002';
const DEFAULT_CHAT_URL = 'http://localhost:3001';

// ── API Client ──────────────────────────────────────────────────────────────

export class KodaApiClient {
  private apiUrl: string;
  private aiUrl: string;
  private chatUrl: string;
  private apiKey?: string;

  constructor(config?: {
    apiUrl?: string;
    aiUrl?: string;
    chatUrl?: string;
    apiKey?: string;
  }) {
    this.apiUrl = config?.apiUrl || DEFAULT_API_URL;
    this.aiUrl = config?.aiUrl || DEFAULT_AI_URL;
    this.chatUrl = config?.chatUrl || DEFAULT_CHAT_URL;
    this.apiKey = config?.apiKey;
  }

  // ── Codegen ────────────────────────────────────────────────────────────

  /**
   * Generate code from the current document selection.
   * Sends the full scene graph + tokens to koda-ai.
   */
  async generateCode(
    document: KodaDocument,
    selectedFrameId: string,
    options: {
      framework?: 'react' | 'vue' | 'html-css';
      cssFramework?: 'tailwind' | 'css-modules' | 'scss' | 'vanilla';
      typescript?: boolean;
      accessibility?: boolean;
      responsive?: boolean;
    } = {}
  ): Promise<CodegenResponse> {
    const frame = this.extractFrame(document, selectedFrameId);
    if (!frame) throw new Error(`Frame not found: ${selectedFrameId}`);

    const request: CodegenRequest = {
      contractVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      frame,
      components: this.extractComponents(document),
      tokens: this.extractTokens(document),
      options: {
        framework: options.framework || 'react',
        cssFramework: options.cssFramework || 'tailwind',
        typescript: options.typescript ?? true,
        accessibility: options.accessibility ?? true,
        responsive: options.responsive ?? true,
        darkMode: false,
      },
    };

    return this.post<CodegenResponse>(`${this.aiUrl}/generate`, request);
  }

  /**
   * Analyze design without generating code.
   */
  async analyzeDesign(document: KodaDocument): Promise<any> {
    const rootData = this.serializeNode(document.root);
    return this.post(`${this.aiUrl}/analyze`, { design: rootData });
  }

  // ── Chat ───────────────────────────────────────────────────────────────

  /**
   * Send a chat message and get AI response.
   * The AI may return design operations to apply to the scene graph.
   */
  async sendChatMessage(
    sessionId: string,
    message: string,
    modelConfig: {
      provider: string;
      apiKey?: string;
      model?: string;
    },
    document?: KodaDocument
  ): Promise<ChatMessage> {
    const context = document ? {
      currentPage: document.root.children[0]?.name,
      selectedNodes: [],
      tokenCount: tokenManager.getAll().length,
    } : undefined;

    const response = await this.post<any>(`${this.chatUrl}/api/chat`, {
      sessionId,
      message,
      modelConfig,
      context,
    });

    return {
      id: response.id || `msg_${Date.now()}`,
      role: 'assistant',
      content: response.content || response.message,
      timestamp: new Date().toISOString(),
      operations: response.operations,
      designs: response.designs,
    };
  }

  // ── Health ─────────────────────────────────────────────────────────────

  async checkHealth(): Promise<{ ai: boolean; chat: boolean; api: boolean }> {
    const checks = await Promise.allSettled([
      this.get(`${this.aiUrl}/health`),
      this.get(`${this.chatUrl}/health`),
      this.get(`${this.apiUrl}/healthz`),
    ]);

    return {
      ai: checks[0].status === 'fulfilled',
      chat: checks[1].status === 'fulfilled',
      api: checks[2].status === 'fulfilled',
    };
  }

  // ── Private ────────────────────────────────────────────────────────────

  private extractFrame(document: KodaDocument, frameId: string) {
    const frame = this.findNode(document.root, frameId);
    if (!frame) return null;

    return {
      id: frame.id,
      name: frame.name,
      width: frame.width,
      height: frame.height,
      nodeTree: this.serializeNode(frame),
    };
  }

  private extractComponents(document: KodaDocument) {
    return document.components.map((comp) => ({
      id: comp.id,
      name: comp.name,
      root: this.serializeNode(comp),
    }));
  }

  private extractTokens(document: KodaDocument): any {
    // Merge document tokens with token manager
    const docTokens = (document as any).tokens || {};
    const managerTokens = tokenManager.export();

    return {
      colors: {
        ...managerTokens.brand,
        ...managerTokens.semantic,
        ...managerTokens.surface,
        ...managerTokens.text,
        ...managerTokens.border,
        ...docTokens.colors,
      },
      typography: {
        ...managerTokens.typography,
        ...docTokens.typography,
      },
      spacing: {
        ...managerTokens.spacing,
        ...docTokens.spacing,
      },
    };
  }

  private serializeNode(node: SceneNode): any {
    return {
      id: node.id,
      type: node.type,
      name: node.name,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      rotation: node.rotation,
      opacity: node.opacity,
      visible: node.visible,
      fills: node.fills,
      strokes: node.strokes,
      effects: node.effects,
      cornerRadius: node.cornerRadius,
      textContent: node.textContent,
      textStyle: node.textStyle,
      layout: node.layout,
      componentId: node.componentId,
      overrides: node.overrides,
      isInstance: !!node.componentId,
      children: node.children.map((c) => this.serializeNode(c)),
    };
  }

  private findNode(node: SceneNode, id: string): SceneNode | null {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = this.findNode(child, id);
      if (found) return found;
    }
    return null;
  }

  private async get<T>(url: string): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['x-koda-internal-key'] = this.apiKey;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
    return res.json();
  }

  private async post<T>(url: string, body: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['x-koda-internal-key'] = this.apiKey;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || `POST ${url} failed: ${res.status}`);
    }

    const data = await res.json();
    return data.data || data;
  }
}

// ── WebSocket Client for Chat ───────────────────────────────────────────────

export class KodaChatSocket {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  connect(url: string = 'http://localhost:3001'): void {
    // Socket.IO compatible connection
    // In production, use socket.io-client
    console.log(`[KodaChat] Connecting to ${url} for session ${this.sessionId}`);
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data: any): void {
    // Send via WebSocket
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }

  sendMessage(message: string, modelConfig: any): void {
    this.emit('chat-message', {
      sessionId: this.sessionId,
      message,
      modelConfig,
    });
  }
}

// ── Singleton ───────────────────────────────────────────────────────────────

export const apiClient = new KodaApiClient();
