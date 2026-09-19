// ============================================================================
// Inspect Panel — Dev Mode: Exact Measurements, Token References
//
// Read-only panel showing precise values for developer handoff.
// Shows token references instead of raw values when available.
// ============================================================================

import { useEditorStore } from '@/store';
import type { SceneNode, Color } from '@shared/types';

function TokenBadge({ tokenName }: { tokenName: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-koda-accent/10 text-koda-accent text-2xs rounded font-mono">
      {tokenName}
    </span>
  );
}

function ColorDisplay({ color, label }: { color: Color; label: string }) {
  const hex = color.hex || `#${[color.r, color.g, color.b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

  return (
    <div className="flex items-center gap-2 py-1">
      <div
        className="w-5 h-5 rounded border border-koda-border shrink-0"
        style={{ backgroundColor: hex, opacity: color.a }}
      />
      <span className="text-2xs text-koda-text-secondary">{label}</span>
      <span className="text-xs font-mono text-koda-text ml-auto">{hex}</span>
      {color.tokenRef && <TokenBadge tokenName={color.tokenRef} />}
    </div>
  );
}

function PropertySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <div className="text-2xs text-koda-text-secondary uppercase tracking-wider mb-1 px-3">
        {title}
      </div>
      <div className="px-3 space-y-0.5">{children}</div>
    </div>
  );
}

function DataRow({ label, value, token }: { label: string; value: string | number; token?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-2xs text-koda-text-secondary">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-xs font-mono text-koda-text">{value}</span>
        {token && <TokenBadge tokenName={token} />}
      </div>
    </div>
  );
}

export function InspectPanel() {
  const { document, selectedIds, showProperties } = useEditorStore();

  if (!showProperties || !document || selectedIds.size === 0) return null;

  const selectedId = Array.from(selectedIds)[0];
  const node = findNode(document.root, selectedId);

  if (!node) return null;

  return (
    <div className="w-60 bg-koda-surface flex flex-col overflow-hidden min-w-0 shrink-0">
      <div className="px-3 py-2 border-b border-koda-border">
        <span className="text-xs font-medium text-koda-text-secondary uppercase tracking-wider">
          Inspect
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-koda-border">
        {/* Identity */}
        <PropertySection title="Identity">
          <DataRow label="Name" value={node.name} />
          <DataRow label="Type" value={node.type} />
          <DataRow label="ID" value={node.id.slice(0, 12) + '...'} />
        </PropertySection>

        {/* Position & Size */}
        <PropertySection title="Position & Size">
          <div className="grid grid-cols-2 gap-x-3">
            <DataRow label="X" value={`${Math.round(node.x)}px`} />
            <DataRow label="Y" value={`${Math.round(node.y)}px`} />
            <DataRow label="W" value={`${Math.round(node.width)}px`} />
            <DataRow label="H" value={`${Math.round(node.height)}px`} />
          </div>
          {node.rotation !== 0 && (
            <DataRow label="Rotation" value={`${node.rotation}°`} />
          )}
        </PropertySection>

        {/* Appearance */}
        <PropertySection title="Appearance">
          <DataRow label="Opacity" value={`${Math.round(node.opacity * 100)}%`} />
          <DataRow label="Blend" value={node.blendMode} />
          {node.cornerRadius.topLeft > 0 && (
            <DataRow label="Radius" value={`${node.cornerRadius.topLeft}px`} />
          )}
        </PropertySection>

        {/* Fills */}
        {node.fills.length > 0 && (
          <PropertySection title="Fill">
            {node.fills.filter((f) => f.visible).map((fill, i) => (
              <div key={i}>
                <DataRow label={`Type`} value={fill.type} />
                {fill.color && (
                  <ColorDisplay
                    color={fill.color}
                    label={`Color ${Math.round(fill.opacity * 100)}%`}
                  />
                )}
              </div>
            ))}
          </PropertySection>
        )}

        {/* Strokes */}
        {node.strokes.length > 0 && (
          <PropertySection title="Stroke">
            {node.strokes.filter((s) => s.visible).map((stroke, i) => (
              <div key={i}>
                <ColorDisplay color={stroke.color} label={`${stroke.width}px ${stroke.style}`} />
              </div>
            ))}
          </PropertySection>
        )}

        {/* Text */}
        {node.textContent && (
          <PropertySection title="Text">
            <div className="text-xs text-koda-text bg-koda-bg rounded p-2 font-mono mt-1">
              "{node.textContent}"
            </div>
            {node.textStyle && (
              <div className="mt-2 space-y-0.5">
                <DataRow label="Font" value={node.textStyle.fontFamily} />
                <DataRow label="Size" value={`${node.textStyle.fontSize}px`} />
                <DataRow label="Weight" value={node.textStyle.fontWeight} />
                <DataRow label="Line H." value={node.textStyle.lineHeight} />
                <DataRow label="Letter Sp." value={`${node.textStyle.letterSpacing}px`} />
                <DataRow label="Align" value={node.textStyle.textAlign} />
                {node.textStyle.color && (
                  <ColorDisplay color={node.textStyle.color} label="Text Color" />
                )}
              </div>
            )}
          </PropertySection>
        )}

        {/* Layout */}
        {node.layout.mode !== 'none' && (
          <PropertySection title="Auto Layout">
            <DataRow label="Direction" value={node.layout.direction} />
            <DataRow label="Justify" value={node.layout.justifyContent} />
            <DataRow label="Align" value={node.layout.alignItems} />
            <DataRow label="Gap" value={`${node.layout.gap}px`} />
            <DataRow label="Padding" value={`${node.layout.padding.top}/${node.layout.padding.right}/${node.layout.padding.bottom}/${node.layout.padding.left}`} />
          </PropertySection>
        )}

        {/* Children */}
        {node.children.length > 0 && (
          <PropertySection title="Children">
            <DataRow label="Count" value={node.children.length} />
          </PropertySection>
        )}
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
