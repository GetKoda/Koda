// ============================================================================
// Layers Panel — Node Tree View
// ============================================================================

import { useEditorStore } from '@/store';
import type { SceneNode } from '@shared/types';
import {
  ChevronRightIcon, ChevronDownIcon,
  EyeIcon, EyeOffIcon, LockIcon, UnlockIcon,
  FrameIcon, RectangleIcon, EllipseIcon, TextIcon,
  ComponentIcon, LayersIcon, LineIcon, PenIcon,
  PlusIcon,
} from './icons';

const nodeIcons: Record<string, React.ReactNode> = {
  canvas: <LayersIcon size={12} />,
  frame: <FrameIcon size={12} />,
  rectangle: <RectangleIcon size={12} />,
  ellipse: <EllipseIcon size={12} />,
  text: <TextIcon size={12} />,
  component: <ComponentIcon size={12} />,
  instance: <ComponentIcon size={12} />,
  group: <LayersIcon size={12} />,
  line: <LineIcon size={12} />,
  pen: <PenIcon size={12} />,
};

function LayerItem({ node, depth }: { node: SceneNode; depth: number }) {
  const { selectedIds, hoveredId, select, setHovered, updateNode } = useEditorStore();
  const isSelected = selectedIds.has(node.id);
  const isHovered = hoveredId === node.id;
  const hasChildren = node.children.length > 0;
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      <div
        className={`
          group flex items-center gap-1 h-7 cursor-pointer text-xs
          transition-colors duration-75
          ${isSelected
            ? 'bg-koda-accent/15 text-koda-accent'
            : isHovered
              ? 'bg-koda-border/40 text-koda-text'
              : 'text-koda-text-secondary hover:bg-koda-border/30 hover:text-koda-text'
          }
        `}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        onClick={(e) => {
          e.stopPropagation();
          select(node.id);
        }}
        onMouseEnter={() => setHovered(node.id)}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Expand toggle */}
        <button
          className="w-4 h-4 flex items-center justify-center shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {hasChildren ? (
            expanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />
          ) : (
            <span className="w-3" />
          )}
        </button>

        {/* Icon */}
        <span className="w-4 h-4 flex items-center justify-center shrink-0 opacity-60">
          {nodeIcons[node.type] || <RectangleIcon size={12} />}
        </span>

        {/* Name */}
        <span className="flex-1 truncate font-medium">{node.name}</span>

        {/* Actions (visible on hover) */}
        <div className="hidden group-hover:flex items-center gap-0.5 mr-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateNode(node.id, { visible: !node.visible });
            }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-koda-border text-koda-text-secondary"
          >
            {node.visible ? <EyeIcon size={11} /> : <EyeOffIcon size={11} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateNode(node.id, { locked: !node.locked });
            }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-koda-border text-koda-text-secondary"
          >
            {node.locked ? <LockIcon size={11} /> : <UnlockIcon size={11} />}
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded && node.children.map((child) => (
        <LayerItem key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

export function LayersPanel() {
  const { document, showLayers } = useEditorStore();

  if (!showLayers || !document) return null;

  return (
    <div className="w-56 bg-koda-surface border-r border-koda-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-koda-border">
        <span className="text-xs font-semibold text-koda-text-secondary uppercase tracking-wider">
          Layers
        </span>
        <button className="w-6 h-6 rounded flex items-center justify-center text-koda-text-secondary hover:bg-koda-border hover:text-koda-text transition-colors">
          <PlusIcon size={14} />
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {document.root.children.map((child) => (
          <LayerItem key={child.id} node={child} depth={0} />
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
