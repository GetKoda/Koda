// ============================================================================
// Toolbar — Tool Selection + Quick Actions
// ============================================================================

import { useEditorStore, type Tool } from '@/store';
import {
  CursorIcon, FrameIcon, RectangleIcon, EllipseIcon,
  LineIcon, PenIcon, TextIcon, HandIcon,
  ChatIcon, SearchIcon, ZoomInIcon, ZoomOutIcon, SparklesIcon,
} from './icons';

const tools: { id: Tool; label: string; shortcut: string; icon: React.ReactNode }[] = [
  { id: 'select', label: 'Select', shortcut: 'V', icon: <CursorIcon size={16} /> },
  { id: 'frame', label: 'Frame', shortcut: 'F', icon: <FrameIcon size={16} /> },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: <RectangleIcon size={16} /> },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: <EllipseIcon size={16} /> },
  { id: 'line', label: 'Line', shortcut: 'L', icon: <LineIcon size={16} /> },
  { id: 'pen', label: 'Pen', shortcut: 'P', icon: <PenIcon size={16} /> },
  { id: 'text', label: 'Text', shortcut: 'T', icon: <TextIcon size={16} /> },
  { id: 'hand', label: 'Hand', shortcut: 'H', icon: <HandIcon size={16} /> },
];

export function Toolbar() {
  const {
    activeTool, setTool,
    toggleCodegen, toggleChat, toggleInspect,
    showCodegen, showChat, showInspect,
    zoom, setZoom,
  } = useEditorStore();

  return (
    <div className="h-11 bg-koda-surface border-b border-koda-border flex items-center px-2 gap-0.5">
      {/* Tools */}
      <div className="flex items-center gap-0.5 mr-3 pr-3 border-r border-koda-border">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setTool(tool.id)}
            className={`
              w-8 h-8 rounded-md flex items-center justify-center
              transition-all duration-100
              ${activeTool === tool.id
                ? 'bg-koda-accent text-white shadow-sm'
                : 'text-koda-text-secondary hover:bg-koda-border hover:text-koda-text'
              }
            `}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Zoom */}
      <div className="flex items-center gap-0.5 mr-3 pr-3 border-r border-koda-border">
        <button
          onClick={() => setZoom(zoom - 0.1)}
          className="w-7 h-7 rounded flex items-center justify-center text-koda-text-secondary hover:bg-koda-border hover:text-koda-text transition-colors"
          title="Zoom Out"
        >
          <ZoomOutIcon size={14} />
        </button>
        <span className="text-2xs text-koda-text-secondary font-mono w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(zoom + 0.1)}
          className="w-7 h-7 rounded flex items-center justify-center text-koda-text-secondary hover:bg-koda-border hover:text-koda-text transition-colors"
          title="Zoom In"
        >
          <ZoomInIcon size={14} />
        </button>
      </div>

      {/* Panels */}
      <div className="flex items-center gap-0.5 mr-3 pr-3 border-r border-koda-border">
        <button
          onClick={toggleInspect}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors
            ${showInspect
              ? 'bg-koda-accent/15 text-koda-accent'
              : 'text-koda-text-secondary hover:bg-koda-border hover:text-koda-text'
            }`}
          title="Inspect Panel"
        >
          <SearchIcon size={16} />
        </button>
        <button
          onClick={toggleChat}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors
            ${showChat
              ? 'bg-koda-accent/15 text-koda-accent'
              : 'text-koda-text-secondary hover:bg-koda-border hover:text-koda-text'
            }`}
          title="AI Chat"
        >
          <ChatIcon size={16} />
        </button>
      </div>

      {/* Generate Code */}
      <button
        onClick={toggleCodegen}
        className={`
          flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all
          ${showCodegen
            ? 'bg-koda-accent text-white shadow-md shadow-koda-accent/25'
            : 'bg-koda-accent hover:bg-koda-accent-hover text-white shadow-sm hover:shadow-md hover:shadow-koda-accent/20'
          }
        `}
      >
        <SparklesIcon size={14} />
        Generate Code
      </button>
    </div>
  );
}
