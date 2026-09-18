import { useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { MenuBar } from './components/MenuBar';
import { LayersPanel } from './components/LayersPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { InspectPanel } from './components/inspect/InspectPanel';
import { CodegenPanel } from './components/codegen/CodegenPanel';
import { ChatPanel } from './components/chat/ChatPanel';
import { WelcomeScreen } from './components/WelcomeScreen';
import { useEditorStore } from './store';

function App() {
  const { document, setTool, showCodegen, showChat, showInspect } = useEditorStore();

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

  if (!document) {
    return <WelcomeScreen />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-koda-bg text-koda-text overflow-hidden select-none">
      <MenuBar />
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <LayersPanel />
        <Canvas />
        {showInspect ? <InspectPanel /> : <PropertiesPanel />}
        {showCodegen && <CodegenPanel />}
        {showChat && <ChatPanel />}
      </div>
      <div className="h-6 bg-koda-surface border-t border-koda-border flex items-center px-3 text-2xs text-koda-text-secondary">
        <span>Koda v0.1.0</span>
        <span className="mx-2 text-koda-border">|</span>
        <span>{document.root.children[0]?.name || 'No page'}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <span>{document.root.children.length} page(s)</span>
          <span>{document.components.length} component(s)</span>
        </div>
      </div>
    </div>
  );
}

export default App;
