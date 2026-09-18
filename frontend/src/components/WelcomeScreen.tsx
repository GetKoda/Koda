import { useEditorStore, createDefaultNode } from '@/store';
import type { KodaDocument } from '@shared/types';
import { SparklesIcon, CodeIcon, ChatIcon, MagicIcon, PlusIcon, ChevronRightIcon } from './icons';

export function WelcomeScreen() {
  const { setDocument } = useEditorStore();

  const createBlankProject = () => {
    const root = createDefaultNode('canvas', { name: 'Page 1', width: 10000, height: 10000 });
    root.x = -5000;
    root.y = -5000;

    const doc: KodaDocument = {
      id: `doc_${Date.now()}`,
      name: 'Untitled Project',
      version: '1.0',
      root,
      components: [],
      componentDefs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDocument(doc);
  };

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
          onClick={createBlankProject}
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
