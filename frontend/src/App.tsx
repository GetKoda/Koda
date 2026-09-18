// ============================================================================
// Koda Editor — Main App Shell
// ============================================================================

import { useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { LayersPanel } from './components/LayersPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { InspectPanel } from './components/inspect/InspectPanel';
import { CodegenPanel } from './components/codegen/CodegenPanel';
import { ChatPanel } from './components/chat/ChatPanel';
import { useEditorStore, createDefaultNode } from './store';
import type { KodaDocument } from '@shared/types';

function App() {
  const { document, setDocument, setTool, showCodegen, showChat, showInspect } = useEditorStore();

  // Create default document on mount
  useEffect(() => {
    if (!document) {
      const root = createDefaultNode('canvas', { name: 'Canvas', width: 1440, height: 900 });
      const page1 = createDefaultNode('frame', {
        name: 'Page 1',
        width: 1440,
        height: 900,
        fills: [{ type: 'solid', visible: true, opacity: 1, color: { r: 255, g: 255, b: 255, a: 1 } }],
      });
      root.children = [page1];
      page1.parentId = root.id;

      const doc: KodaDocument = {
        id: 'doc_1',
        name: 'Untitled',
        version: '1.0',
        root,
        components: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setDocument(doc);
    }
  }, [document, setDocument]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'v': setTool('select'); break;
        case 'f': setTool('frame'); break;
        case 'r': setTool('rectangle'); break;
        case 'o': setTool('ellipse'); break;
        case 'l': setTool('line'); break;
        case 'p': setTool('pen'); break;
        case 't': setTool('text'); break;
        case 'h': setTool('hand'); break;
        case 'delete':
        case 'backspace': {
          const { selectedIds, removeNode } = useEditorStore.getState();
          selectedIds.forEach((id) => removeNode(id));
          break;
        }
        case 'escape': {
          useEditorStore.getState().clearSelection();
          setTool('select');
          break;
        }
        case 'e': {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            useEditorStore.getState().toggleCodegen();
          }
          break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool]);

  return (
    <div className="h-screen w-screen flex flex-col bg-koda-bg text-koda-text overflow-hidden select-none">
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Layers */}
        <LayersPanel />

        {/* Center: Canvas */}
        <Canvas />

        {/* Right: Properties or Inspect */}
        {showInspect ? <InspectPanel /> : <PropertiesPanel />}

        {/* Right side panel: Codegen or Chat */}
        {showCodegen && <CodegenPanel />}
        {showChat && <ChatPanel />}
      </div>

      {/* Bottom Status Bar */}
      <div className="h-6 bg-koda-surface border-t border-koda-border flex items-center px-3 text-2xs text-koda-text-secondary">
        <span>Koda Editor v0.1.0</span>
        <div className="flex-1" />
        {document && (
          <div className="flex items-center gap-4">
            <span>{document.root.children.length} page(s)</span>
            <span>{document.components.length} component(s)</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
