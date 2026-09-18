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
    <div className="h-screen w-screen flex flex-col bg-[#f5f5f5] text-[#171717] overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-[#e5e5e5] flex items-center px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#6366f1] rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-[#171717]">Koda</span>
        </div>
        <div className="flex-1" />
        <nav className="flex items-center gap-6 text-sm text-[#737373]">
          <a href="#" className="hover:text-[#171717] transition-colors">Docs</a>
          <a href="#" className="hover:text-[#171717] transition-colors">GitHub</a>
          <a href="#" className="hover:text-[#171717] transition-colors">Changelog</a>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6366f1]/10 text-[#6366f1] text-xs font-medium mb-6">
            <SparklesIcon size={12} />
            Design to Code, Powered by AI
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4 leading-tight text-[#171717]">
            Design pixel-perfect UIs.<br />
            <span className="text-[#6366f1]">Generate production code.</span>
          </h1>
          <p className="text-[#737373] text-base leading-relaxed max-w-lg mx-auto">
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
            <div key={i} className="p-5 rounded-xl bg-white border border-[#e5e5e5] hover:border-[#d4d4d4] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1] mb-3">
                {feature.icon}
              </div>
              <h3 className="text-sm font-semibold mb-1 text-[#171717]">{feature.title}</h3>
              <p className="text-xs text-[#737373] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={createBlankProject}
          className="group flex items-center gap-3 px-8 py-4 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl font-medium text-sm shadow-xl shadow-[#6366f1]/20 transition-all hover:shadow-2xl hover:shadow-[#6366f1]/30"
        >
          <PlusIcon size={18} />
          New Project
          <ChevronRightIcon size={16} className="opacity-50 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <p className="mt-4 text-2xs text-[#737373]">
          Free and open source. AGPL-3.0 licensed.
        </p>
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-[#e5e5e5] flex items-center justify-center px-4 bg-white">
        <div className="flex items-center gap-6 text-2xs text-[#737373]">
          <span>GetKoda</span>
          <span className="w-px h-3 bg-[#e5e5e5]" />
          <span>v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}
