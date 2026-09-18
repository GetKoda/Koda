// ============================================================================
// Menu Bar — File, Edit, View, Help + Editable Project Name + Theme Toggle
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@/store';
import { useTheme } from '@/contexts/ThemeContext';
import {
  SaveIcon, FileIcon, DownloadIcon, UploadIcon, ShareIcon,
  UndoIcon, RedoIcon, CopyIcon, TrashIcon,
  ZoomInIcon, ZoomOutIcon, GridIcon, MaximizeIcon,
  LayersIcon, PropertiesIcon, CodeIcon, ChatIcon,
  SettingsIcon, HistoryIcon, SearchIcon,
  SunIcon, MoonIcon,
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [editValue, setEditValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const store = useEditorStore();
  const { theme, toggleTheme } = useTheme();

  const projectName = store.document?.name || 'Untitled Project';

  const startEditing = () => {
    setEditValue(projectName);
    setIsEditingName(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const finishEditing = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== projectName) {
      store.renameDocument(trimmed);
    }
    setIsEditingName(false);
  };

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingName]);

  const menus: MenuGroup[] = [
    {
      label: 'File',
      items: [
        { label: 'New Document', shortcut: 'Ctrl+N', icon: <FileIcon size={14} />, action: () => {} },
        { label: 'Open...', shortcut: 'Ctrl+O' },
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
        { divider: true, label: '' },
        {
          label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
          icon: theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />,
          action: toggleTheme,
        },
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

      <div className="flex-1" />

      {/* Editable project name */}
      <div className="absolute left-1/2 -translate-x-1/2">
        {isEditingName ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') finishEditing();
              if (e.key === 'Escape') setIsEditingName(false);
            }}
            className="bg-koda-bg border border-koda-accent rounded-md px-3 py-0.5 text-xs text-koda-text text-center
                       focus:outline-none min-w-[180px]"
          />
        ) : (
          <button
            onClick={startEditing}
            className="px-3 py-0.5 text-xs text-koda-text-secondary hover:text-koda-text rounded-md
                       hover:bg-koda-border/50 transition-colors"
          >
            {projectName}
          </button>
        )}
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-koda-text-secondary
                   hover:text-koda-text hover:bg-koda-border/50 transition-colors"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
      </button>
    </div>
  );
}
