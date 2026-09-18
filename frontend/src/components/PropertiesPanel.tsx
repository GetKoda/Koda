// ============================================================================
// Properties Panel — Edit Selected Node Properties
// ============================================================================

import { useEditorStore } from '@/store';
import type { SceneNode } from '@shared/types';

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <label className="text-2xs text-koda-text-secondary w-16 shrink-0 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex-1 flex items-center gap-1">{children}</div>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={Math.round(value * 100) / 100}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      min={min}
      max={max}
      className="w-full bg-koda-bg border border-koda-border rounded px-2 py-1 text-xs text-koda-text font-mono
                 focus:outline-none focus:border-koda-accent transition-colors"
    />
  );
}

function ColorSwatch({ color }: { color: { r: number; g: number; b: number; a: number } }) {
  const hex = `#${[color.r, color.g, color.b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
  return (
    <div
      className="w-5 h-5 rounded border border-koda-border shrink-0"
      style={{ backgroundColor: hex, opacity: color.a }}
    />
  );
}

export function PropertiesPanel() {
  const { document, selectedIds, showProperties, updateNode } = useEditorStore();

  if (!showProperties || !document || selectedIds.size === 0) return null;

  const selectedId = Array.from(selectedIds)[0];
  const node = findNode(document.root, selectedId);

  if (!node) return null;

  const update = (updates: Partial<SceneNode>) => updateNode(node.id, updates);

  return (
    <div className="w-60 bg-koda-surface border-l border-koda-border flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-koda-border">
        <span className="text-xs font-medium text-koda-text-secondary uppercase tracking-wider">
          Properties
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-3">
        {/* Name */}
        <PropertyRow label="Name">
          <input
            type="text"
            value={node.name}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full bg-koda-bg border border-koda-border rounded px-2 py-1 text-xs text-koda-text
                       focus:outline-none focus:border-koda-accent transition-colors"
          />
        </PropertyRow>

        {/* Position */}
        <div className="px-3">
          <div className="text-2xs text-koda-text-secondary uppercase tracking-wider mb-1">
            Position
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-2xs text-koda-text-secondary">X</label>
              <NumberInput value={node.x} onChange={(x) => update({ x })} />
            </div>
            <div>
              <label className="text-2xs text-koda-text-secondary">Y</label>
              <NumberInput value={node.y} onChange={(y) => update({ y })} />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="px-3">
          <div className="text-2xs text-koda-text-secondary uppercase tracking-wider mb-1">
            Size
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-2xs text-koda-text-secondary">W</label>
              <NumberInput value={node.width} onChange={(width) => update({ width })} min={1} />
            </div>
            <div>
              <label className="text-2xs text-koda-text-secondary">H</label>
              <NumberInput value={node.height} onChange={(height) => update({ height })} min={1} />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <PropertyRow label="Rotation">
          <NumberInput value={node.rotation} onChange={(rotation) => update({ rotation })} />
          <span className="text-2xs text-koda-text-secondary">°</span>
        </PropertyRow>

        {/* Opacity */}
        <PropertyRow label="Opacity">
          <NumberInput
            value={node.opacity}
            onChange={(opacity) => update({ opacity: Math.max(0, Math.min(1, opacity)) })}
            min={0}
            max={1}
          />
        </PropertyRow>

        {/* Corner Radius */}
        <div className="px-3">
          <div className="text-2xs text-koda-text-secondary uppercase tracking-wider mb-1">
            Corner Radius
          </div>
          <NumberInput
            value={node.cornerRadius.topLeft}
            onChange={(v) =>
              update({
                cornerRadius: {
                  topLeft: v,
                  topRight: v,
                  bottomRight: v,
                  bottomLeft: v,
                },
              })
            }
            min={0}
          />
        </div>

        {/* Fill */}
        <div className="px-3">
          <div className="text-2xs text-koda-text-secondary uppercase tracking-wider mb-1">
            Fill
          </div>
          {node.fills.length > 0 && node.fills[0].color ? (
            <div className="flex items-center gap-2">
              <ColorSwatch color={node.fills[0].color} />
              <span className="text-xs font-mono text-koda-text">
                #{[node.fills[0].color.r, node.fills[0].color.g, node.fills[0].color.b]
                  .map((c) => Math.round(c).toString(16).padStart(2, '0'))
                  .join('')}
              </span>
            </div>
          ) : (
            <span className="text-xs text-koda-text-secondary">None</span>
          )}
        </div>
      </div>
    </div>
  );
}

function findNode(node: SceneNode, id: string): SceneNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}
