// ============================================================================
// Resizable Panel — Draggable resize + collapse for sidebars
// ============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronRightIcon } from './icons';

interface ResizablePanelProps {
  children: React.ReactNode;
  side: 'left' | 'right';
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  collapsed?: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
  className?: string;
}

export function ResizablePanel({
  children,
  side,
  defaultSize = 224,
  minSize = 160,
  maxSize = 400,
  collapsed: controlledCollapsed,
  onCollapse,
  onExpand,
  className = '',
}: ResizablePanelProps) {
  const [size, setSize] = useState(defaultSize);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const collapsed = controlledCollapsed ?? isCollapsed;

  const handleCollapse = useCallback(() => {
    if (onCollapse) onCollapse();
    else setIsCollapsed(true);
  }, [onCollapse]);

  const handleExpand = useCallback(() => {
    if (onExpand) onExpand();
    else setIsCollapsed(false);
  }, [onExpand]);

  // Drag to resize
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      let newSize: number;

      if (side === 'left') {
        newSize = e.clientX - rect.left;
      } else {
        newSize = rect.right - e.clientX;
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = side === 'left' ? 'col-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, side, minSize, maxSize]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  if (collapsed) {
    return (
      <div
        ref={panelRef}
        className={`bg-koda-surface flex flex-col shrink-0 ${className}`}
        style={{ width: 40 }}
      >
        {/* Expand button */}
        <div className="flex-1 flex flex-col items-center py-2">
          <button
            onClick={handleExpand}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-koda-text-secondary hover:bg-koda-border hover:text-koda-text transition-colors"
            title={`Expand ${side} panel`}
          >
            {side === 'left' ? <ChevronRightIcon size={14} /> : <ChevronRightIcon size={14} className="rotate-180" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={`bg-koda-surface flex flex-col overflow-hidden shrink-0 relative ${className}`}
      style={{ width: size }}
    >
      {children}

      {/* Resize handle */}
      <div
        className={`absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-koda-accent/50 transition-colors z-10
          ${isDragging ? 'bg-koda-accent/50' : ''}
          ${side === 'left' ? 'right-0' : 'left-0'}`}
        onMouseDown={handleDragStart}
      />

      {/* Collapse button */}
      <button
        onClick={handleCollapse}
        className={`absolute top-2 ${side === 'left' ? 'right-2' : 'left-2'} w-6 h-6 rounded flex items-center justify-center text-koda-text-secondary hover:bg-koda-border hover:text-koda-text transition-colors z-10 opacity-0 group-hover:opacity-100`}
        title={`Collapse ${side} panel`}
      >
        {side === 'left' ? <ChevronRightIcon size={12} className="rotate-180" /> : <ChevronRightIcon size={12} />}
      </button>
    </div>
  );
}
