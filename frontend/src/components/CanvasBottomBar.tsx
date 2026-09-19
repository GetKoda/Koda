import { useEditorStore } from '@/store';
import {
  CursorIcon, FrameIcon, RectangleIcon, EllipseIcon,
  LineIcon, PenIcon, TextIcon, HandIcon,
  ZoomInIcon, ZoomOutIcon, MaximizeIcon,
} from './icons';

export function CanvasBottomBar() {
  const {
    activeTool, setTool, zoom, setZoom, setPan,
  } = useEditorStore();

  const tools = [
    { id: 'select', icon: <CursorIcon size={15} />, label: 'Select (V)' },
    { id: 'frame', icon: <FrameIcon size={15} />, label: 'Frame (F)' },
    { id: 'rectangle', icon: <RectangleIcon size={15} />, label: 'Rectangle (R)' },
    { id: 'ellipse', icon: <EllipseIcon size={15} />, label: 'Ellipse (O)' },
    { id: 'line', icon: <LineIcon size={15} />, label: 'Line (L)' },
    { id: 'pen', icon: <PenIcon size={15} />, label: 'Pen (P)' },
    { id: 'text', icon: <TextIcon size={15} />, label: 'Text (T)' },
    { id: 'hand', icon: <HandIcon size={15} />, label: 'Hand (H)' },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-koda-surface/90 backdrop-blur-xl border border-koda-border rounded-xl px-2 py-1.5 shadow-2xl shadow-black/30">
      {/* Tools */}
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setTool(tool.id as any)}
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-100
            ${activeTool === tool.id
              ? 'bg-koda-accent text-white shadow-sm'
              : 'text-koda-text-secondary hover:bg-koda-border hover:text-koda-text'
            }
          `}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}

      {/* Divider */}
      <div className="w-px h-5 bg-koda-border mx-1" />

      {/* Zoom controls */}
      <button
        onClick={() => setZoom(zoom - 0.1)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-koda-text-secondary hover:bg-koda-border hover:text-koda-text transition-colors"
        title="Zoom Out"
      >
        <ZoomOutIcon size={13} />
      </button>
      <button
        onClick={() => setZoom(1)}
        className="min-w-[44px] h-7 rounded-lg flex items-center justify-center text-2xs text-koda-text-secondary font-mono hover:bg-koda-border hover:text-koda-text transition-colors"
        title="Reset Zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        onClick={() => setZoom(zoom + 0.1)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-koda-text-secondary hover:bg-koda-border hover:text-koda-text transition-colors"
        title="Zoom In"
      >
        <ZoomInIcon size={13} />
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-koda-border mx-1" />

      {/* Fit to screen */}
      <button
        onClick={() => {
          setZoom(1);
          setPan(0, 0);
        }}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-koda-text-secondary hover:bg-koda-border hover:text-koda-text transition-colors"
        title="Fit to Screen"
      >
        <MaximizeIcon size={13} />
      </button>
    </div>
  );
}
