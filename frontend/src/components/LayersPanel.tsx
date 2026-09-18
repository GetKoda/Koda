// ============================================================================
// Layers Panel — Node Tree View
// ============================================================================

import { useEditorStore } from '@/store';
import type { SceneNode } from '@shared/types';

const nodeIcons: Record<string, string> = {
  canvas: '📄',
  frame: '▢',
  group: '📁',
  rectangle: '□',
  ellipse: '○',
  polygon: '⬠',
  star: '★',
  line: '╱',
  vector: '✒',
  text: 'T',
  image: '🖼',
  component: '◆',
  instance: '◇',
};

function LayerItem({ node, depth }: { node: SceneNode; depth: number }) {
  const { selectedIds, hoveredId, select, setHovered } = useEditorStore();
  const isSelected = selectedIds.has(node.id);
  const isHovered = hoveredId === node.id;

  return (
    <>
      <div
        className={`
          flex items-center gap-1.5 px-2 py-1 cursor-pointer text-xs
          transition-colors duration-75
          ${isSelected ? 'bg-koda-accent/20 text-koda-accent' : ''}
          ${isHovered && !isSelected ? 'bg-koda-border/50' : ''}
          ${!isSelected && !isHovered ? 'text-koda-text-secondary hover:bg-koda-border/30' : ''}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => select(node.id)}
        onMouseEnter={() => setHovered(node.id)}
        onMouseLeave={() => setHovered(null)}
      >
        <span className="w-4 text-center opacity-60">{nodeIcons[node.type] || '?'}</span>
        <span className="truncate flex-1">{node.name}</span>
        {!node.visible && <span className="opacity-30">👁</span>}
        {node.locked && <span className="opacity-30">🔒</span>}
      </div>
      {node.children.map((child) => (
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
      <div className="px-3 py-2 border-b border-koda-border">
        <span className="text-xs font-medium text-koda-text-secondary uppercase tracking-wider">
          Layers
        </span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {document.root.children.map((child) => (
          <LayerItem key={child.id} node={child} depth={0} />
        ))}
      </div>
    </div>
  );
}
