// ============================================================================
// Menu Bar — File, Edit, View, Help
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/store';
import {
  SaveIcon, FileIcon, DownloadIcon, UploadIcon, ShareIcon,
  UndoIcon, RedoIcon, CopyIcon, TrashIcon,
  ZoomInIcon, ZoomOutIcon, GridIcon, MaximizeIcon,
  LayersIcon, PropertiesIcon, CodeIcon, ChatIcon,
  SettingsIcon, HistoryIcon, SearchIcon,
} from './icons';

interface MenuItem {
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action?: () => void;
  divider?: boolean;
  disabled?: boolean;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const store = useEditorStore();

  const menus: MenuGroup[] = [
    {
      label: 'File',
      items: [
        { label: 'New Document', shortcut: 'Ctrl+N', icon: <FileIcon size={14} />, action: () => {} },
        { label: 'Open...', shortcut: 'Ctrl+O', icon: <FolderIcon size={14} /> },
        { divider: true, label: '' },
        { label: 'Save', shortcut: 'Ctrl+S', icon: <SaveIcon size={14} /> },
        { label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
        { divider: true, label: '' },
        { label: 'Import', icon: <UploadIcon size={14} /> },
        { label: 'Export', shortcut: 'Ctrl+E', icon: <DownloadIcon size={14} /> },
        { divider: true, label: '' },
        { label: 'Share...', icon: <ShareIcon size={14} /> },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', icon: <UndoIcon size={14} /> },
        { label: 'Redo', shortcut: 'Ctrl+Shift+Z', icon: <RedoIcon size={14} /> },
        { divider: true, label: '' },
        { label: 'Cut', shortcut: 'Ctrl+X' },
        { label: 'Copy', shortcut: 'Ctrl+C', icon: <CopyIcon size={14} /> },
        { label: 'Paste', shortcut: 'Ctrl+V' },
        { divider: true, label: '' },
        { label: 'Select All', shortcut: 'Ctrl+A' },
        { label: 'Duplicate', shortcut: 'Ctrl+D' },
        { divider: true, label: '' },
        { label: 'Delete', shortcut: 'Del', icon: <TrashIcon size={14} /> },
      ],
    },
    {
      label: 'View',
      items: [
        { label: 'Zoom In', shortcut: 'Ctrl++', icon: <ZoomInIcon size={14} />, action: () => store.setZoom(store.zoom + 0.1) },
        { label: 'Zoom Out', shortcut: 'Ctrl+-', icon: <ZoomOutIcon size={14} />, action: () => store.setZoom(store.zoom - 0.1) },
        { label: 'Zoom to Fit', shortcut: 'Ctrl+1', icon: <MaximizeIcon size={14} />, action: () => store.zoomToFit() },
        { divider: true, label: '' },
        { label: 'Show Grid', icon: <GridIcon size={14} /> },
        { label: 'Snap to Grid' },
        { divider: true, label: '' },
        { label: 'Toggle Layers', icon: <LayersIcon size={14} />, action: () => store.toggleLayers() },
        { label: 'Toggle Properties', icon: <PropertiesIcon size={14} />, action: () => store.toggleProperties() },
        { label: 'Toggle Code Panel', icon: <CodeIcon size={14} />, action: () => store.toggleCodegen() },
        { label: 'Toggle Chat Panel', icon: <ChatIcon size={14} />, action: () => store.toggleChat() },
      ],
    },
    {
      label: 'Help',
      items: [
        { label: 'Documentation', icon: <SearchIcon size={14} /> },
        { label: 'Keyboard Shortcuts', shortcut: 'Ctrl+/' },
        { divider: true, label: '' },
        { label: 'Version History', icon: <HistoryIcon size={14} /> },
        { label: 'Settings', icon: <SettingsIcon size={14} /> },
      ],
    },
  ];

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={menuRef} className="h-8 bg-koda-surface border-b border-koda-border flex items-center px-2 relative z-50">
      {menus.map((menu) => (
        <div key={menu.label} className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
            onMouseEnter={() => openMenu && setOpenMenu(menu.label)}
            className={`
              px-2.5 py-1 text-xs rounded transition-colors
              ${openMenu === menu.label
                ? 'bg-koda-border text-koda-text'
                : 'text-koda-text-secondary hover:text-koda-text hover:bg-koda-border/50'
              }
            `}
          >
            {menu.label}
          </button>

          {openMenu === menu.label && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-koda-surface border border-koda-border rounded-lg shadow-xl py-1 animate-fade-in">
              {menu.items.map((item, i) =>
                item.divider ? (
                  <div key={i} className="h-px bg-koda-border my-1" />
                ) : (
                  <button
                    key={i}
                    onClick={() => {
                      item.action?.();
                      setOpenMenu(null);
                    }}
                    disabled={item.disabled}
                    className={`
                      w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left
                      ${item.disabled
                        ? 'text-koda-text-secondary/50 cursor-not-allowed'
                        : 'text-koda-text-secondary hover:bg-koda-border/50 hover:text-koda-text'
                      }
                    `}
                  >
                    <span className="w-4 shrink-0">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && (
                      <span className="text-2xs text-koda-text-secondary/60 font-mono">{item.shortcut}</span>
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FolderIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}
