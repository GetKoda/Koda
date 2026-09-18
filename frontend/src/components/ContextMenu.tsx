import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store';
import {
  TrashIcon, CopyIcon, LayersIcon, EyeIcon, EyeOffIcon,
  LockIcon, UnlockIcon, PlusIcon,
} from './icons';

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
  danger?: boolean;
  disabled?: boolean;
  dividerAfter?: boolean;
}

export function ContextMenu({ x, y, onClose }: { x: number; y: number; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    document: kodaDoc, selectedIds, hoveredId,
    removeNode, updateNode, select, addNode, moveNode,
  } = useEditorStore();

  const targetId = hoveredId || Array.from(selectedIds)[0];
  const targetNode = targetId && kodaDoc
    ? (() => {
        const find = (n: any): any => {
          if (n.id === targetId) return n;
          for (const c of n.children) { const f = find(c); if (f) return f; }
          return null;
        };
        return find(kodaDoc.root);
      })()
    : null;

  const items: MenuItem[] = [];

  if (targetNode) {
    items.push(
      {
        label: 'Duplicate',
        icon: <CopyIcon size={14} />,
        shortcut: 'Ctrl+D',
        action: () => {
          const clone = JSON.parse(JSON.stringify(targetNode));
          clone.id = `node_${Date.now()}`;
          clone.name = `${targetNode.name} Copy`;
          clone.x += 20;
          clone.y += 20;
          addNode(targetNode.parentId || kodaDoc?.root.id || '', clone);
          select(clone.id);
          onClose();
        },
      },
      {
        label: 'Copy',
        icon: <CopyIcon size={14} />,
        shortcut: 'Ctrl+C',
        action: () => {
          navigator.clipboard.writeText(JSON.stringify(targetNode, null, 2));
          onClose();
        },
      },
      { label: '', action: () => {}, dividerAfter: true },
    );
  }

  if (targetNode) {
    items.push({
      label: targetNode.visible ? 'Hide' : 'Show',
      icon: targetNode.visible ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />,
      shortcut: 'H',
      action: () => {
        updateNode(targetId, { visible: !targetNode.visible });
        onClose();
      },
    });
  }

  if (targetNode) {
    items.push({
      label: targetNode.locked ? 'Unlock' : 'Lock',
      icon: targetNode.locked ? <UnlockIcon size={14} /> : <LockIcon size={14} />,
      shortcut: 'L',
      action: () => {
        updateNode(targetId, { locked: !targetNode.locked });
        onClose();
      },
    });
  }

  if (selectedIds.size > 1) {
    items.push({
      label: 'Group into Frame',
      icon: <LayersIcon size={14} />,
      shortcut: 'Ctrl+G',
      action: () => {
        if (!kodaDoc) return;
        const ids = Array.from(selectedIds);
        const nodes = ids.map((id) => {
          const find = (n: any): any => {
            if (n.id === id) return n;
            for (const c of n.children) { const f = find(c); if (f) return f; }
            return null;
          };
          return find(kodaDoc.root);
        }).filter(Boolean);

        if (nodes.length < 2) return;

        const minX = Math.min(...nodes.map((n: any) => n.x));
        const minY = Math.min(...nodes.map((n: any) => n.y));

        const frameNode: any = {
          id: `node_${Date.now()}`,
          name: 'Group',
          type: 'frame',
          visible: true, locked: false, opacity: 1, blendMode: 'normal',
          x: minX,
          y: minY,
          width: 200,
          height: 200,
          rotation: 0,
          cornerRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
          fills: [{ type: 'solid', visible: true, opacity: 0.05, color: { r: 255, g: 255, b: 255, a: 1 } }],
          strokes: [{ visible: true, opacity: 0.1, color: { r: 255, g: 255, b: 255, a: 1 }, width: 1, style: 'solid', align: 'inside' }],
          effects: [],
          layout: { mode: 'none', direction: 'column', wrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'stretch', gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 }, itemSpacing: 0 },
          sizeConstraint: { widthSizing: 'fixed', heightSizing: 'fixed' },
          constraints: { horizontal: 'left', vertical: 'top' },
          children: [] as any[],
          parentId: kodaDoc.root.id,
        };

        const maxX = Math.max(...nodes.map((n: any) => n.x + n.width));
        const maxY = Math.max(...nodes.map((n: any) => n.y + n.height));
        frameNode.width = maxX - minX + 40;
        frameNode.height = maxY - minY + 40;

        for (const id of ids) {
          const node = nodes.find((n: any) => n.id === id);
          if (node) {
            const relNode = { ...node, x: node.x - minX, y: node.y - minY, parentId: frameNode.id };
            frameNode.children.push(relNode);
          }
        }

        let root = kodaDoc.root;
        for (const id of ids) {
          const remove = (n: any): any => ({
            ...n,
            children: n.children.filter((c: any) => c.id !== id).map(remove),
          });
          root = remove(root);
        }

        const addFrame = (n: any): any => {
          if (n.id === root.id) return { ...n, children: [...n.children, frameNode] };
          return { ...n, children: n.children.map(addFrame) };
        };
        root = addFrame(root);

        useEditorStore.setState({
          document: { ...kodaDoc, root },
          selectedIds: new Set([frameNode.id]),
        });
        onClose();
      },
    });
  }

  if (targetNode && targetNode.parentId && targetNode.parentId !== kodaDoc?.root.id) {
    items.push({
      label: 'Move to Parent',
      icon: <LayersIcon size={14} />,
      action: () => {
        moveNode(targetId, targetNode.parentId!);
        onClose();
      },
    });
  }

  if (items.length > 0 && targetNode) {
    items.push({ label: '', action: () => {}, dividerAfter: true });
  }

  if (targetNode) {
    items.push({
      label: 'Delete',
      icon: <TrashIcon size={14} />,
      shortcut: 'Del',
      danger: true,
      action: () => {
        removeNode(targetId);
        onClose();
      },
    });
  }

  if (!targetNode) {
    items.push(
      {
        label: 'Paste',
        icon: <PlusIcon size={14} />,
        shortcut: 'Ctrl+V',
        action: () => { navigator.clipboard.readText().catch(() => {}); onClose(); },
      },
      { label: '', action: () => {}, dividerAfter: true },
      {
        label: 'Select All',
        shortcut: 'Ctrl+A',
        action: () => {
          if (!kodaDoc) return;
          const ids: string[] = [];
          const walk = (n: any) => { ids.push(n.id); n.children.forEach(walk); };
          walk(kodaDoc.root);
          useEditorStore.getState().selectMultiple(ids);
          onClose();
        },
      },
    );
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (items.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[200px] bg-koda-surface border border-koda-border rounded-xl shadow-2xl shadow-black/40 py-1.5"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => {
        if (item.dividerAfter) {
          return (
            <div key={i}>
              <div className="h-px bg-koda-border my-1" />
            </div>
          );
        }
        return (
          <button
            key={i}
            onClick={item.action}
            disabled={item.disabled}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition-colors
              ${item.danger
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-koda-text hover:bg-koda-border hover:text-koda-text'
              }
              ${item.disabled ? 'opacity-40 pointer-events-none' : ''}
            `}
          >
            {item.icon && <span className="flex-shrink-0 opacity-70">{item.icon}</span>}
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && (
              <span className="text-koda-text-secondary text-[10px] font-mono">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
