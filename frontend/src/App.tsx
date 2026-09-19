import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Canvas } from './components/Canvas';
import { MenuBar } from './components/MenuBar';
import { LayersPanel } from './components/LayersPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { InspectPanel } from './components/inspect/InspectPanel';
import { ResizablePanel } from './components/ResizablePanel';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ProjectDashboard } from './components/ProjectDashboard';
import { ThemeProvider } from './contexts/ThemeContext';
import { useEditorStore } from './store';
import { saveProject, getProject } from './services/project-manager';

function Editor() {
  const { document, setTool, canvasColor, setCanvasColor, showInspect } = useEditorStore();

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

  useEffect(() => {
    const interval = setInterval(() => {
      const doc = useEditorStore.getState().document;
      if (doc) saveProject(doc);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-koda-bg text-koda-text overflow-hidden select-none">
      <MenuBar />
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanel side="left" defaultSize={224} minSize={160} maxSize={400}>
          <LayersPanel canvasColor={canvasColor} onCanvasColorChange={setCanvasColor} />
        </ResizablePanel>
        <Canvas />
        <ResizablePanel side="right" defaultSize={240} minSize={180} maxSize={400}>
          {showInspect ? <InspectPanel /> : <PropertiesPanel />}
        </ResizablePanel>
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

function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { document, setDocument } = useEditorStore();

  useEffect(() => {
    if (projectId && !document) {
      const doc = getProject(projectId);
      if (doc) {
        setDocument(doc);
      }
    }
  }, [projectId, document, setDocument]);

  if (!document) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-koda-bg text-koda-text">
        <div className="text-sm text-koda-text-secondary">Loading project...</div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Editor />
    </ThemeProvider>
  );
}

function DashboardPage() {
  return <ProjectDashboard />;
}

function LandingPage() {
  return <WelcomeScreen />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/editor/:projectId" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
