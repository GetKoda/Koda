import { useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { MenuBar } from './components/MenuBar';
import { LayersPanel } from './components/LayersPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { InspectPanel } from './components/inspect/InspectPanel';
import { CodegenPanel } from './components/codegen/CodegenPanel';
import { ChatPanel } from './components/chat/ChatPanel';
import { ComponentPanel } from './components/ComponentPanel';
import { CanvasColorBar } from './components/CanvasColorBar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ThemeProvider } from './contexts/ThemeContext';
import { useEditorStore } from './store';

function Editor() {
  const { document, setTool, showCodegen, showChat, showInspect, canvasColor, setCanvasColor } = useEditorStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'v': if (!e.ctrlKey && !e.metaKey) setTool('select'); break;
        case 'f': if (!e.ctrlKey && !e.metaKey) setTool('frame'); break;
        case 'r': if (!e.ctrlKey && !e.metaKey) setTool('rectangle'); break;
        case 'o': if (!e.ctrlKey && !e.metaKey) setTool('ellipse'); break;
        case 'l': if (!e.ctrlKey && !e.metaKey) setTool('line'); break;
        case 'p': if (!e.ctrlKey && !e.metaKey) setTool('pen'); break;
        case 't': if (!e.ctrlKey && !e.metaKey) setTool('text'); break;
        case 'h': if (!e.ctrlKey && !e.metaKey) setTool('hand'); break;
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
      <MenuBar />
      {/* Canvas color bar */}
      <div className="h-9 bg-koda-surface border-b border-koda-border flex items-center px-3">
        <CanvasColorBar color={canvasColor} onChange={setCanvasColor} />
      </div>
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <LayersPanel />
        <Canvas />
        {showInspect ? <InspectPanel /> : <PropertiesPanel />}
        {showCodegen && <CodegenPanel />}
        {showChat && <ChatPanel />}
        <ComponentPanel />
      </div>
      <div className="h-6 bg-koda-surface border-t border-koda-border flex items-center px-3 text-2xs text-koda-text-secondary">
        <span>Koda v0.1.0</span>
        <span className="mx-2 text-koda-border">|</span>
        <span>{document?.root.children[0]?.name || 'No page'}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <span>{document?.root.children.length ?? 0} page(s)</span>
          <span>{(document?.componentDefs || []).length} component(s)</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { document } = useEditorStore();

  if (!document) {
    return <WelcomeScreen />;
  }

  return (
    <ThemeProvider>
      <Editor />
    </ThemeProvider>
  );
}

export default App;
