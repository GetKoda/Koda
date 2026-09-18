import { useState } from 'react';
import { useEditorStore, createDefaultNode } from '@/store';
import type { KodaDocument } from '@shared/types';
import { DEVICE_FRAMES, DEVICE_CATEGORIES } from '../services/device-frames';
import {
  SparklesIcon, CodeIcon, ChatIcon, MagicIcon,
  PlusIcon, SearchIcon, ChevronRightIcon, CloseIcon,
} from './icons';

export function WelcomeScreen() {
  const { setDocument } = useEditorStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('phone');
  const [selectedFrames, setSelectedFrames] = useState<Set<string>>(new Set());
  const [customWidth, setCustomWidth] = useState(1440);
  const [customHeight, setCustomHeight] = useState(900);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFrames = DEVICE_FRAMES.filter((f) => {
    const matchesCategory = selectedCategory === 'custom' ? f.id === 'custom' : f.category === selectedCategory;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFrame = (id: string) => {
    const next = new Set(selectedFrames);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFrames(next);
  };

  const createProject = () => {
    const root = createDefaultNode('canvas', { name: 'Canvas', width: 10000, height: 10000 });
    root.x = -5000;
    root.y = -5000;

    let offsetX = 0;

    // Create selected device frames
    const framesToCreate = selectedCategory === 'custom'
      ? [{ id: 'custom', name: projectName || 'Custom Frame', width: customWidth, height: customHeight, icon: 'frame', category: 'custom' as const }]
      : DEVICE_FRAMES.filter((f) => selectedFrames.has(f.id));

    if (framesToCreate.length === 0) {
      // Default: one blank frame
      framesToCreate.push({ id: 'blank', name: 'Frame', width: 1440, height: 900, icon: 'frame', category: 'desktop' as const });
    }

    for (const frame of framesToCreate) {
      const frameNode = createDefaultNode('frame', {
        name: frame.name,
        x: offsetX,
        y: 200,
        width: frame.width,
        height: frame.height,
        fills: [{ type: 'solid', visible: true, opacity: 1, color: { r: 255, g: 255, b: 255, a: 1 } }],
      });
      root.children.push(frameNode);
      frameNode.parentId = root.id;
      offsetX += frame.width + 200;
    }

    const doc: KodaDocument = {
      id: `doc_${Date.now()}`,
      name: projectName || 'Untitled Project',
      version: '1.0',
      root,
      components: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDocument(doc);
  };

  // ── Landing Page ──────────────────────────────────────────────────────

  if (!showNewProject) {
    return (
      <div className="h-screen w-screen flex flex-col bg-koda-bg text-koda-text overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-koda-surface/50 backdrop-blur-xl border-b border-koda-border flex items-center px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-koda-accent rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">K</span>
            </div>
            <span className="text-sm font-bold tracking-tight">Koda</span>
          </div>
          <div className="flex-1" />
          <nav className="flex items-center gap-6 text-sm text-koda-text-secondary">
            <a href="#" className="hover:text-koda-text transition-colors">Docs</a>
            <a href="#" className="hover:text-koda-text transition-colors">GitHub</a>
            <a href="#" className="hover:text-koda-text transition-colors">Changelog</a>
          </nav>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-center max-w-2xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-koda-accent/10 text-koda-accent text-xs font-medium mb-6">
              <SparklesIcon size={12} />
              Design to Code, Powered by AI
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-4 leading-tight">
              Design pixel-perfect UIs.<br />
              <span className="text-koda-accent">Generate production code.</span>
            </h1>
            <p className="text-koda-text-secondary text-base leading-relaxed max-w-lg mx-auto">
              Koda is a design editor that generates pixel-perfect frontend code.
              Design visually, then export React, Vue, or HTML — or let AI build it for you.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl w-full mb-12">
            {[
              { icon: <MagicIcon size={20} />, title: 'AI Design Agent', desc: 'Describe your UI in plain language. AI generates the design in your canvas.' },
              { icon: <CodeIcon size={20} />, title: 'Pixel-Perfect Code', desc: 'Select any frame and export React, Vue, or HTML with exact visual fidelity.' },
              { icon: <ChatIcon size={20} />, title: 'Conversational Editing', desc: 'Refine your design with natural language. "Make the header darker." Done.' },
            ].map((feature, i) => (
              <div key={i} className="p-5 rounded-xl bg-koda-surface border border-koda-border hover:border-koda-border-hover transition-colors">
                <div className="w-10 h-10 rounded-lg bg-koda-accent/10 flex items-center justify-center text-koda-accent mb-3">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold mb-1">{feature.title}</h3>
                <p className="text-xs text-koda-text-secondary leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => setShowNewProject(true)}
            className="group flex items-center gap-3 px-8 py-4 bg-koda-accent hover:bg-koda-accent-hover text-white rounded-xl font-medium text-sm shadow-xl shadow-koda-accent/20 transition-all hover:shadow-2xl hover:shadow-koda-accent/30"
          >
            <PlusIcon size={18} />
            New Project
            <ChevronRightIcon size={16} className="opacity-50 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <p className="mt-4 text-2xs text-koda-text-secondary">
            Free and open source. AGPL-3.0 licensed.
          </p>
        </main>

        {/* Footer */}
        <footer className="h-10 border-t border-koda-border flex items-center justify-center px-4">
          <div className="flex items-center gap-6 text-2xs text-koda-text-secondary">
            <span>GetKoda</span>
            <span className="w-px h-3 bg-koda-border" />
            <span>v0.1.0</span>
          </div>
        </footer>
      </div>
    );
  }

  // ── New Project Dialog ────────────────────────────────────────────────

  return (
    <div className="h-screen w-screen flex flex-col bg-koda-bg text-koda-text overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-koda-surface/50 backdrop-blur-xl border-b border-koda-border flex items-center px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-koda-accent rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <span className="text-sm font-bold tracking-tight">Koda</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowNewProject(false)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-koda-text-secondary hover:bg-koda-border transition-colors"
        >
          <CloseIcon size={16} />
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-3xl">
          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Create New Project</h2>
            <p className="text-sm text-koda-text-secondary">Name your project and pick device frames to start designing.</p>
          </div>

          {/* Project Name */}
          <div className="mb-6">
            <label className="text-2xs text-koda-text-secondary uppercase tracking-wider mb-2 block">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome App"
              className="w-full bg-koda-surface border border-koda-border rounded-xl px-4 py-3 text-sm text-koda-text
                         placeholder:text-koda-text-secondary/50 focus:outline-none focus:border-koda-accent transition-colors"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 mb-4 overflow-x-auto">
            {DEVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                  ${selectedCategory === cat.id
                    ? 'bg-koda-accent/15 text-koda-accent border border-koda-accent/30'
                    : 'text-koda-text-secondary hover:bg-koda-border hover:text-koda-text border border-transparent'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-koda-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search devices..."
              className="w-full bg-koda-surface border border-koda-border rounded-lg pl-9 pr-4 py-2 text-xs text-koda-text
                         placeholder:text-koda-text-secondary/50 focus:outline-none focus:border-koda-accent transition-colors"
            />
          </div>

          {/* Device Grid */}
          {selectedCategory === 'custom' ? (
            <div className="p-6 bg-koda-surface border border-koda-border rounded-xl">
              <div className="text-sm font-medium mb-4">Custom Frame Size</div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-2xs text-koda-text-secondary">Width</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 100)}
                    className="w-full mt-1 bg-koda-bg border border-koda-border rounded-lg px-3 py-2 text-sm text-koda-text font-mono focus:outline-none focus:border-koda-accent"
                  />
                </div>
                <span className="text-koda-text-secondary mt-5">×</span>
                <div className="flex-1">
                  <label className="text-2xs text-koda-text-secondary">Height</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 100)}
                    className="w-full mt-1 bg-koda-bg border border-koda-border rounded-lg px-3 py-2 text-sm text-koda-text font-mono focus:outline-none focus:border-koda-accent"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 mb-6 max-h-80 overflow-y-auto pr-1">
              {filteredFrames.map((frame) => (
                <button
                  key={frame.id}
                  onClick={() => toggleFrame(frame.id)}
                  className={`p-4 rounded-xl border text-left transition-all
                    ${selectedFrames.has(frame.id)
                      ? 'border-koda-accent bg-koda-accent/5 shadow-sm'
                      : 'border-koda-border bg-koda-surface hover:border-koda-border-hover'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs font-medium">{frame.name}</div>
                    {selectedFrames.has(frame.id) && (
                      <div className="w-4 h-4 rounded-full bg-koda-accent flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-2xs text-koda-text-secondary font-mono">
                    {frame.width} × {frame.height}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Create Button */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={() => setShowNewProject(false)}
              className="px-5 py-2.5 text-sm text-koda-text-secondary hover:text-koda-text rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createProject}
              className="flex items-center gap-2 px-6 py-2.5 bg-koda-accent hover:bg-koda-accent-hover text-white rounded-xl text-sm font-medium shadow-lg shadow-koda-accent/20 transition-all"
            >
              <PlusIcon size={14} />
              Create Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
