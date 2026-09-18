// ============================================================================
// Toolbar — Tool Selection + Top Actions
// ============================================================================

import { useEditorStore, type Tool } from '@/store';

const tools: { id: Tool; label: string; shortcut: string; icon: string }[] = [
  { id: 'select', label: 'Select', shortcut: 'V', icon: '⬚' },
  { id: 'frame', label: 'Frame', shortcut: 'F', icon: '▢' },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: '□' },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: '○' },
  { id: 'line', label: 'Line', shortcut: 'L', icon: '╱' },
  { id: 'pen', label: 'Pen', shortcut: 'P', icon: '✒' },
  { id: 'text', label: 'Text', shortcut: 'T', icon: 'T' },
  { id: 'hand', label: 'Hand', shortcut: 'H', icon: '✋' },
];

export function Toolbar() {
  const { activeTool, setTool } = useEditorStore();

  return (
    <div className="h-12 bg-koda-surface border-b border-koda-border flex items-center px-3 gap-1">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4 pr-4 border-r border-koda-border">
        <div className="w-6 h-6 bg-koda-accent rounded-md flex items-center justify-center text-white text-xs font-bold">
          K
        </div>
        <span className="text-sm font-semibold text-koda-text">Koda</span>
      </div>

      {/* Tools */}
      <div className="flex items-center gap-0.5">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setTool(tool.id)}
            className={`
              w-8 h-8 rounded-md flex items-center justify-center text-sm
              transition-colors duration-100
              ${activeTool === tool.id
                ? 'bg-koda-accent text-white'
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

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 text-xs text-koda-text-secondary hover:text-koda-text hover:bg-koda-border rounded-md transition-colors">
          Undo
        </button>
        <button className="px-3 py-1.5 text-xs text-koda-text-secondary hover:text-koda-text hover:bg-koda-border rounded-md transition-colors">
          Redo
        </button>
        <div className="w-px h-5 bg-koda-border mx-1" />
        <button className="px-3 py-1.5 text-xs bg-koda-accent hover:bg-koda-accent-hover text-white rounded-md transition-colors font-medium">
          Generate Code
        </button>
      </div>
    </div>
  );
}
