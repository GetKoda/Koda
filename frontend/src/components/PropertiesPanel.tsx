import { useState } from 'react';
import { useEditorStore } from '@/store';
import type { SceneNode } from '@shared/types';
import {
  RectangleIcon, EllipseIcon, TextIcon, FrameIcon,
  ComponentIcon, LayersIcon, LockIcon, UnlockIcon,
  EyeIcon, EyeOffIcon,
} from './icons';

function Section({ title, children, defaultOpen = true }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-koda-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-koda-border/30 transition-colors"
      >
        <span className="text-2xs font-semibold text-koda-text-secondary uppercase tracking-wider">
          {title}
        </span>
        <span className={`text-koda-text-secondary transition-transform text-2xs ${open ? '' : '-rotate-90'}`}>
          &#9662;
        </span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-2xs text-koda-text-secondary w-7 shrink-0 uppercase">{label}</label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, min, max, unit }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string;
}) {
  return (
    <div className="relative flex-1">
      <input
        type="number"
        value={Math.round(value * 100) / 100}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min} max={max}
        className="w-full bg-koda-bg border border-koda-border rounded px-2 py-1 text-xs text-koda-text font-mono
                   focus:outline-none focus:border-koda-accent transition-colors"
      />
      {unit && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-koda-text-secondary pointer-events-none">
          {unit}
        </span>
      )}
    </div>
  );
}

function ColorSwatch({ color }: { color: { r: number; g: number; b: number; a: number } }) {
  const hex = `#${[color.r, color.g, color.b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
  return (
    <div className="w-4 h-4 rounded border border-koda-border shrink-0" style={{ backgroundColor: hex, opacity: color.a }} title={hex} />
  );
}

const nodeTypeIcons: Record<string, React.ReactNode> = {
  canvas: <LayersIcon size={12} />,
  frame: <FrameIcon size={12} />,
  rectangle: <RectangleIcon size={12} />,
  ellipse: <EllipseIcon size={12} />,
  text: <TextIcon size={12} />,
  component: <ComponentIcon size={12} />,
  instance: <ComponentIcon size={12} />,
  group: <LayersIcon size={12} />,
};

export function PropertiesPanel() {
  const { document, selectedIds, showProperties, updateNode } = useEditorStore();

  if (!showProperties || !document || selectedIds.size === 0) return null;

  const selectedId = Array.from(selectedIds)[0];
  const node = findNode(document.root, selectedId);
  if (!node) return null;

  const update = (updates: Partial<SceneNode>) => updateNode(node.id, updates);

  return (
    <div className="w-60 bg-koda-surface border-l border-koda-border flex flex-col overflow-hidden">
      <div className="h-10 flex items-center gap-2 px-3 border-b border-koda-border">
        <span className="text-koda-text-secondary">{nodeTypeIcons[node.type] || <RectangleIcon size={12} />}</span>
        <input
          type="text"
          value={node.name}
          onChange={(e) => update({ name: e.target.value })}
          className="flex-1 bg-transparent text-xs font-semibold text-koda-text focus:outline-none focus:bg-koda-bg rounded px-1 py-0.5"
        />
        <div className="flex items-center gap-0.5">
          <button onClick={() => update({ visible: !node.visible })} className="w-6 h-6 rounded flex items-center justify-center text-koda-text-secondary hover:bg-koda-border">
            {node.visible ? <EyeIcon size={12} /> : <EyeOffIcon size={12} />}
          </button>
          <button onClick={() => update({ locked: !node.locked })} className="w-6 h-6 rounded flex items-center justify-center text-koda-text-secondary hover:bg-koda-border">
            {node.locked ? <LockIcon size={12} /> : <UnlockIcon size={12} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section title="Position & Size">
          <div className="grid grid-cols-2 gap-2">
            <Field label="X"><NumInput value={node.x} onChange={(x) => update({ x })} unit="px" /></Field>
            <Field label="Y"><NumInput value={node.y} onChange={(y) => update({ y })} unit="px" /></Field>
            <Field label="W"><NumInput value={node.width} onChange={(w) => update({ width: w })} min={1} unit="px" /></Field>
            <Field label="H"><NumInput value={node.height} onChange={(h) => update({ height: h })} min={1} unit="px" /></Field>
          </div>
          <div className="mt-2">
            <Field label="R"><NumInput value={node.rotation} onChange={(r) => update({ rotation: r })} unit="deg" /></Field>
          </div>
        </Section>

        <Section title="Appearance">
          <div className="space-y-2">
            <Field label="Op">
              <NumInput value={node.opacity} onChange={(o) => update({ opacity: Math.max(0, Math.min(1, o)) })} min={0} max={1} />
            </Field>
            <div>
              <label className="text-2xs text-koda-text-secondary uppercase mb-1 block">Corner Radius</label>
              <NumInput
                value={node.cornerRadius.topLeft}
                onChange={(v) => update({ cornerRadius: { topLeft: v, topRight: v, bottomRight: v, bottomLeft: v } })}
                min={0} unit="px"
              />
            </div>
          </div>
        </Section>

        <Section title="Fill">
          {node.fills.length > 0 && node.fills[0].color ? (
            <div className="flex items-center gap-2">
              <ColorSwatch color={node.fills[0].color} />
              <span className="text-xs font-mono text-koda-text">
                #{[node.fills[0].color.r, node.fills[0].color.g, node.fills[0].color.b]
                  .map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}
              </span>
            </div>
          ) : (
            <span className="text-xs text-koda-text-secondary">No fill</span>
          )}
        </Section>

        <Section title="Stroke" defaultOpen={false}>
          {node.strokes.length > 0 && node.strokes[0].color ? (
            <div className="flex items-center gap-2">
              <ColorSwatch color={node.strokes[0].color} />
              <span className="text-xs text-koda-text">
                {node.strokes[0].width}px {node.strokes[0].style}
              </span>
            </div>
          ) : (
            <span className="text-xs text-koda-text-secondary">No stroke</span>
          )}
        </Section>

        {node.textContent && (
          <Section title="Text">
            <div className="space-y-1.5">
              <div className="text-xs text-koda-text bg-koda-bg rounded px-2 py-1.5 font-mono">"{node.textContent}"</div>
              {node.textStyle && (
                <div className="space-y-1.5 mt-2">
                  <Field label="Font"><span className="text-xs text-koda-text">{node.textStyle.fontFamily}</span></Field>
                  <Field label="Size"><NumInput value={node.textStyle.fontSize} onChange={() => {}} unit="px" /></Field>
                  <Field label="Wt"><NumInput value={node.textStyle.fontWeight} onChange={() => {}} /></Field>
                </div>
              )}
            </div>
          </Section>
        )}

        {node.layout.mode !== 'none' && (
          <Section title="Auto Layout">
            <div className="space-y-1.5">
              <Field label="Dir"><span className="text-xs text-koda-text">{node.layout.direction}</span></Field>
              <Field label="Gap"><NumInput value={node.layout.gap} onChange={() => {}} unit="px" /></Field>
            </div>
          </Section>
        )}

        {node.children.length > 0 && (
          <Section title="Children" defaultOpen={false}>
            <span className="text-xs text-koda-text">{node.children.length} child nodes</span>
          </Section>
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
