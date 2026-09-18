// ============================================================================
// Chat Panel — AI Conversational Interface
//
// Send natural language prompts to koda-chat.
// AI returns design operations that modify the scene graph.
// ============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/store';
import { apiClient } from '@/services/api-client';
import type { ChatMessage } from '@/services/types';

interface ChatSession {
  id: string;
  messages: ChatMessage[];
}

export function ChatPanel() {
  const { document, toggleCodegen } = useEditorStore();
  const [session] = useState<ChatSession>({
    id: `session_${Date.now()}`,
    messages: [],
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [modelConfig, setModelConfig] = useState({
    provider: 'openai' as string,
    model: 'gpt-4o',
    apiKey: '',
  });
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'system',
        content: `Welcome to Koda Chat! I can help you design UI and generate code.\n\nTry:\n• "Create a login screen"\n• "Add a navigation bar to this page"\n• "Change all buttons to blue"\n• "Generate code for this design"`,
        timestamp: new Date().toISOString(),
      }]);
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      // Check if user wants code generation
      const wantsCode = input.toLowerCase().includes('generate') ||
                        input.toLowerCase().includes('export') ||
                        input.toLowerCase().includes('code');

      if (wantsCode) {
        // Trigger codegen
        toggleCodegen();
        const systemMsg: ChatMessage = {
          id: `sys_${Date.now()}`,
          role: 'assistant',
          content: 'Opening the Code Generator panel. Select a frame and click "Generate Code" to export your design.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, systemMsg]);
      } else {
        // Send to chat service
        const response = await apiClient.sendChatMessage(
          session.id,
          input.trim(),
          {
            provider: modelConfig.provider,
            model: modelConfig.model,
            apiKey: modelConfig.apiKey || undefined,
          },
          document || undefined
        );

        setMessages((prev) => [...prev, response]);

        // Apply design operations if any
        if (response.operations && response.operations.length > 0) {
          applyDesignOperations(response.operations);
        }
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to send message'}. Make sure the chat service is running.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  }, [input, sending, session.id, modelConfig, document, toggleCodegen]);

  const applyDesignOperations = (operations: any[]) => {
    // TODO: Apply design operations to the scene graph
    // Each operation modifies nodes in the editor
    console.log('[KodaChat] Applying operations:', operations);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-koda-surface">
      {/* Header */}
      <div className="px-4 py-3 border-b border-koda-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-koda-accent/20 flex items-center justify-center">
            <span className="text-xs text-koda-accent">AI</span>
          </div>
          <span className="text-sm font-semibold text-koda-text">Koda Chat</span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-koda-text-secondary hover:text-koda-text text-xs px-2 py-1 rounded hover:bg-koda-border"
        >
          Settings
        </button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="p-3 border-b border-koda-border space-y-2">
          <div>
            <label className="text-2xs text-koda-text-secondary">Provider</label>
            <select
              value={modelConfig.provider}
              onChange={(e) => setModelConfig((c) => ({ ...c, provider: e.target.value }))}
              className="w-full mt-1 bg-koda-bg border border-koda-border rounded px-2 py-1.5 text-xs text-koda-text"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>
          <div>
            <label className="text-2xs text-koda-text-secondary">API Key</label>
            <input
              type="password"
              value={modelConfig.apiKey}
              onChange={(e) => setModelConfig((c) => ({ ...c, apiKey: e.target.value }))}
              placeholder="sk-..."
              className="w-full mt-1 bg-koda-bg border border-koda-border rounded px-2 py-1.5 text-xs text-koda-text"
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`
                max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-koda-accent text-white rounded-br-sm'
                  : msg.role === 'system'
                    ? 'bg-koda-border/50 text-koda-text-secondary rounded-bl-sm'
                    : 'bg-koda-bg text-koda-text border border-koda-border rounded-bl-sm'
                }
              `}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Design previews */}
              {msg.designs && msg.designs.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.designs.map((design: any, i: number) => (
                    <div key={i} className="p-2 bg-koda-surface rounded-lg border border-koda-border">
                      <div className="text-xs font-medium text-koda-text">{design.name}</div>
                      <div className="text-2xs text-koda-text-secondary mt-1">{design.description}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Operations indicator */}
              {msg.operations && msg.operations.length > 0 && (
                <div className="mt-2 text-2xs text-koda-accent">
                  {msg.operations.length} design change(s) applied
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-koda-border">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to create or modify..."
            rows={2}
            className="flex-1 bg-koda-bg border border-koda-border rounded-lg px-3 py-2 text-sm text-koda-text
                       resize-none focus:outline-none focus:border-koda-accent transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${input.trim() && !sending
                ? 'bg-koda-accent hover:bg-koda-accent-hover text-white'
                : 'bg-koda-border text-koda-text-secondary cursor-not-allowed'
              }
            `}
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
