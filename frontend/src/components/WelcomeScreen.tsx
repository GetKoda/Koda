// ============================================================================
// Welcome Screen — First-Run Onboarding
//
// Shown when no document is open. Clean, professional, like Figma's start.
// ============================================================================

import { useState } from 'react';
import { useEditorStore, createDefaultNode } from '@/store';
import type { KodaDocument } from '@shared/types';
import { FileIcon, SparklesIcon, FolderIcon, MagicIcon, ImportIcon } from './icons';

const templates = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch',
    icon: FileIcon,
    width: 1440,
    height: 900,
  },
  {
    id: 'mobile',
    name: 'Mobile App',
    description: '375×812 iPhone frame',
    icon: MagicIcon,
    width: 375,
    height: 812,
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: '1440×900 desktop layout',
    icon: FolderIcon,
    width: 1440,
    height: 900,
  },
  {
    id: 'landing',
    name: 'Landing Page',
    description: '1440×2000 long page',
    icon: SparklesIcon,
    width: 1440,
    height: 2000,
  },
];

export function WelcomeScreen() {
  const { setDocument } = useEditorStore();
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const createDocument = (template: typeof templates[0]) => {
    const root = createDefaultNode('canvas', { name: 'Canvas', width: template.width, height: template.height });
    const page1 = createDefaultNode('frame', {
      name: template.id === 'mobile' ? 'iPhone 14' : 'Page 1',
      width: template.width,
      height: template.height,
      fills: [{ type: 'solid', visible: true, opacity: 1, color: { r: 255, g: 255, b: 255, a: 1 } }],
    });
    root.children = [page1];
    page1.parentId = root.id;

    const doc: KodaDocument = {
      id: `doc_${Date.now()}`,
      name: template.name,
      version: '1.0',
      root,
      components: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDocument(doc);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-koda-bg text-koda-text">
      {/* Header */}
      <header className="h-12 bg-koda-surface border-b border-koda-border flex items-center px-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-koda-accent rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <span className="text-sm font-semibold">Koda</span>
        </div>
        <div className="flex-1" />
        <span className="text-xs text-koda-text-secondary">v0.1.0</span>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-3xl px-6">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-3">
              Welcome to <span className="text-koda-accent">Koda</span>
            </h1>
            <p className="text-koda-text-secondary text-sm max-w-md mx-auto leading-relaxed">
              Design pixel-perfect UIs and generate production-ready code.
              Start with a template or create a blank canvas.
            </p>
          </div>

          {/* Templates */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {templates.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => createDocument(template)}
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  className={`
                    group relative p-5 rounded-xl border text-left transition-all duration-200
                    ${hoveredTemplate === template.id
                      ? 'border-koda-accent bg-koda-accent/5 shadow-lg shadow-koda-accent/10'
                      : 'border-koda-border bg-koda-surface hover:border-koda-border-hover'
                    }
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors
                    ${hoveredTemplate === template.id
                      ? 'bg-koda-accent/20 text-koda-accent'
                      : 'bg-koda-border text-koda-text-secondary group-hover:text-koda-text'
                    }
                  `}>
                    <Icon size={20} />
                  </div>
                  <div className="font-medium text-sm mb-1">{template.name}</div>
                  <div className="text-xs text-koda-text-secondary">{template.description}</div>
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 text-xs text-koda-text-secondary hover:text-koda-text hover:bg-koda-surface rounded-lg transition-colors">
              <ImportIcon size={14} />
              Import file
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-xs text-koda-text-secondary hover:text-koda-text hover:bg-koda-surface rounded-lg transition-colors">
              <FolderIcon size={14} />
              Open recent
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-koda-border flex items-center justify-center px-4">
        <div className="flex items-center gap-6 text-2xs text-koda-text-secondary">
          <span>AGPL-3.0</span>
          <span className="w-px h-3 bg-koda-border" />
          <span>GetKoda</span>
          <span className="w-px h-3 bg-koda-border" />
          <span>Ctrl+N for new document</span>
        </div>
      </footer>
    </div>
  );
}
