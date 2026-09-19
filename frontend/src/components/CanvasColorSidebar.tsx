// ============================================================================
// Canvas Color Sidebar — Color picker in the left sidebar
// ============================================================================

import { useState, useRef, useEffect } from 'react';

interface CanvasColorSidebarProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#0a0a0a', '#141414', '#1a1a1a', '#1e1e1e', '#222222',
  '#2a2a2a', '#333333', '#444444', '#555555', '#666666',
  '#888888', '#aaaaaa', '#cccccc', '#dddddd', '#eeeeee',
  '#f5f5f5', '#fef3c7', '#fde68a', '#fcd34d', '#f59e0b',
  '#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb',
  '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1',
  '#d1fae5', '#6ee7b7', '#34d399', '#10b981', '#059669',
  '#fee2e2', '#fca5a5', '#f87171', '#ef4444', '#dc2626',
  '#f3e8ff', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed',
  '#fce7f3', '#f9a8d4', '#f472b6', '#ec4899', '#db2777',
];

export function CanvasColorSidebar({ color, onChange }: CanvasColorSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(color);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomColor(color);
  }, [color]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as HTMLElement)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-koda-border/50 transition-colors group"
        title="Canvas Background"
      >
        <div
          className="w-4 h-4 rounded border border-koda-border shadow-inner flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-2xs text-koda-text-secondary group-hover:text-koda-text transition-colors truncate">
          Canvas
        </span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-64 bg-koda-surface border border-koda-border rounded-xl shadow-2xl shadow-black/40 p-3 z-50">
          {/* Current color */}
          <div className="flex items-center gap-3 mb-3 p-2 bg-koda-bg rounded-lg">
            <div
              className="w-8 h-8 rounded-lg border border-koda-border shadow-inner"
              style={{ backgroundColor: color }}
            />
            <div>
              <div className="text-2xs text-koda-text-secondary">Current</div>
              <div className="text-xs font-mono text-koda-text">{color.toUpperCase()}</div>
            </div>
          </div>

          {/* Preset grid */}
          <div className="mb-3">
            <div className="text-2xs text-koda-text-secondary mb-2">Presets</div>
            <div className="grid grid-cols-10 gap-1">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => onChange(preset)}
                  className={`w-5 h-5 rounded border transition-all hover:scale-110
                    ${color === preset
                      ? 'border-koda-accent ring-1 ring-koda-accent scale-110'
                      : 'border-koda-border hover:border-koda-border-hover'
                    }`}
                  style={{ backgroundColor: preset }}
                  title={preset}
                />
              ))}
            </div>
          </div>

          {/* Custom */}
          <div>
            <div className="text-2xs text-koda-text-secondary mb-2">Custom</div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  onChange(e.target.value);
                }}
                className="w-7 h-7 rounded border border-koda-border cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomColor(val);
                  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                    onChange(val);
                  }
                }}
                placeholder="#1a1a1a"
                className="flex-1 bg-koda-bg border border-koda-border rounded px-2 py-1 text-xs text-koda-text font-mono
                           placeholder:text-koda-text-secondary/50 focus:outline-none focus:border-koda-accent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
