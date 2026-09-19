import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon, CodeIcon, ChatIcon, MagicIcon,
  PlusIcon, ChevronRightIcon,
} from './icons';

// ── Animated Counter ──────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ── Mock Editor Preview ──────────────────────────────────────────────────
function EditorPreview() {
  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-[#6366f1]/20 via-[#8b5cf6]/20 to-[#6366f1]/20 rounded-3xl blur-2xl" />

      {/* Editor mockup */}
      <div className="relative bg-white rounded-2xl border border-[#e5e5e5] shadow-2xl overflow-hidden">
        {/* Title bar */}
        <div className="h-10 bg-[#f5f5f5] border-b border-[#e5e5e5] flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white border border-[#e5e5e5] rounded-md px-20 py-1 text-2xs text-[#737373]">
              Untitled Project
            </div>
          </div>
          <div className="w-16" />
        </div>

        {/* Editor content */}
        <div className="flex h-[400px]">
          {/* Left panel */}
          <div className="w-48 bg-white border-r border-[#e5e5e5] p-3 hidden md:block">
            <div className="text-2xs font-semibold text-[#737373] uppercase tracking-wider mb-2">Layers</div>
            {['Header Section', 'Hero Frame', 'Card Grid', 'Footer'].map((name, i) => (
              <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${i === 1 ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'text-[#737373]'}`}>
                <div className="w-3 h-3 rounded bg-[#e5e5e5]" />
                {name}
              </div>
            ))}
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-[#f0f0f0] relative overflow-hidden">
            {/* Dot grid */}
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />

            {/* Frame mockup */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[320px] bg-white rounded-lg shadow-lg border border-[#e5e5e5] overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]" />
              <div className="p-4">
                <div className="h-4 bg-[#171717] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[#e5e5e5] rounded w-full mb-1" />
                <div className="h-3 bg-[#e5e5e5] rounded w-5/6 mb-4" />
                <div className="flex gap-2">
                  <div className="h-8 bg-[#6366f1] rounded flex-1" />
                  <div className="h-8 bg-[#e5e5e5] rounded flex-1" />
                </div>
              </div>
            </div>

            {/* Codegen panel mockup */}
            <div className="absolute bottom-0 right-0 w-[220px] bg-[#1a1a1a] border-t border-l border-[#2a2a2a] rounded-tl-lg p-3 hidden md:block">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded bg-[#6366f1]/20 flex items-center justify-center">
                  <CodeIcon size={10} className="text-[#6366f1]" />
                </div>
                <span className="text-2xs font-semibold text-white">Generated Code</span>
              </div>
              <div className="font-mono text-[10px] text-[#a3a3a3] leading-relaxed">
                <div><span className="text-[#818cf8]">{'<'}</span><span className="text-[#22d3ee]">div</span> <span className="text-[#a78bfa]">className</span><span className="text-[#737373]">=</span><span className="text-[#86efac]">"hero"</span><span className="text-[#818cf8]">{'>'}</span></div>
                <div className="pl-4"><span className="text-[#818cf8]">{'<'}</span><span className="text-[#22d3ee]">h1</span><span className="text-[#818cf8]">{'>'}</span><span className="text-white">Welcome</span><span className="text-[#818cf8]">{'</'}</span><span className="text-[#22d3ee]">h1</span><span className="text-[#818cf8]">{'>'}</span></div>
                <div className="pl-4"><span className="text-[#818cf8]">{'<'}</span><span className="text-[#22d3ee]">p</span><span className="text-[#818cf8]">{'>'}</span><span className="text-[#a3a3a3]">...</span><span className="text-[#818cf8]">{'</'}</span><span className="text-[#22d3ee]">p</span><span className="text-[#818cf8]">{'>'}</span></div>
                <div><span className="text-[#818cf8]">{'</'}</span><span className="text-[#22d3ee]">div</span><span className="text-[#818cf8]">{'>'}</span></div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-48 bg-white border-l border-[#e5e5e5] p-3 hidden lg:block">
            <div className="text-2xs font-semibold text-[#737373] uppercase tracking-wider mb-2">Properties</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xs text-[#737373]">Width</span>
                <span className="text-2xs font-mono text-[#171717]">320px</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xs text-[#737373]">Height</span>
                <span className="text-2xs font-mono text-[#171717]">240px</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-4 h-4 rounded border border-[#e5e5e5]" style={{ backgroundColor: '#6366f1' }} />
                <span className="text-2xs font-mono text-[#171717]">#6366f1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Landing Page ────────────────────────────────────────────────────
export function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-[#171717] overflow-x-hidden">
      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto h-14 flex items-center px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#6366f1] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">K</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-[#171717]">Koda</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 ml-10 text-sm text-[#737373]">
            <a href="#features" className="hover:text-[#171717] transition-colors">Features</a>
            <a href="#workflow" className="hover:text-[#171717] transition-colors">Workflow</a>
            <a href="#community" className="hover:text-[#171717] transition-colors">Community</a>
            <a href="#" className="hover:text-[#171717] transition-colors">Docs</a>
          </nav>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm text-[#737373] hover:text-[#171717] transition-colors hidden sm:block">Log in</a>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-[#171717] text-white text-sm font-medium rounded-lg hover:bg-[#404040] transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6366f1]/10 text-[#6366f1] text-xs font-medium mb-8">
            <SparklesIcon size={12} />
            Open Source Design Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Design visually.<br />
            <span className="text-[#6366f1]">Ship production code.</span>
          </h1>
          <p className="text-lg text-[#737373] max-w-2xl mx-auto mb-10 leading-relaxed">
            The open-source design tool that bridges design and development.
            Create pixel-perfect UIs, generate clean React, Vue, or HTML code — or let AI build it for you.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="group flex items-center gap-2 px-7 py-3.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl font-medium text-sm shadow-xl shadow-[#6366f1]/25 transition-all hover:shadow-2xl hover:shadow-[#6366f1]/35"
            >
              <PlusIcon size={16} />
              Start Designing
              <ChevronRightIcon size={14} className="opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a href="#features" className="flex items-center gap-2 px-7 py-3.5 bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#171717] rounded-xl font-medium text-sm transition-colors">
              See How It Works
            </a>
          </div>
        </div>

        {/* Editor Preview */}
        <EditorPreview />
      </section>

      {/* ── Social Proof ────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-[#e5e5e5] bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-[#737373] mb-8">
            Built for designers and developers who ship fast
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40">
            {['React', 'Vue', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Svelte'].map((name) => (
              <span key={name} className="text-lg font-bold tracking-tight text-[#171717]">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need to design and ship
            </h2>
            <p className="text-[#737373] text-lg max-w-2xl mx-auto">
              A complete design toolkit with AI superpowers. From wireframe to production code in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <MagicIcon size={22} />,
                title: 'AI Design Agent',
                desc: 'Describe your UI in plain language. Koda generates the design directly on your canvas — not just mockups, real editable nodes.',
                color: '#6366f1',
              },
              {
                icon: <CodeIcon size={22} />,
                title: 'Pixel-Perfect Code',
                desc: 'Select any frame and export React, Vue, Svelte, or HTML with exact visual fidelity. No cleanup needed.',
                color: '#22c55e',
              },
              {
                icon: <ChatIcon size={22} />,
                title: 'Conversational Editing',
                desc: 'Refine your design with natural language. "Make the header darker" or "Add a hover state" — done.',
                color: '#f59e0b',
              },
            ].map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-[#e5e5e5] hover:border-[#d4d4d4] hover:shadow-lg transition-all duration-300">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[#737373] leading-relaxed">{feature.desc}</p>
              </div>
            ))}

            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                ),
                title: 'Component System',
                desc: 'Build reusable component libraries with variants, properties, and auto-layout. Ship consistent UIs across your team.',
                color: '#8b5cf6',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                ),
                title: 'Real-Time Collaboration',
                desc: 'Work together on the same file. See cursors, leave comments, and iterate faster with your team.',
                color: '#ec4899',
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                ),
                title: 'Design Tokens',
                desc: 'Define colors, spacing, and typography as tokens. Change once, update everywhere. Export to code instantly.',
                color: '#06b6d4',
              },
            ].map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-[#e5e5e5] hover:border-[#d4d4d4] hover:shadow-lg transition-all duration-300">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[#737373] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ────────────────────────────────────────────────────── */}
      <section id="workflow" className="py-24 px-6 bg-[#fafafa] border-y border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              From idea to production in three steps
            </h2>
            <p className="text-[#737373] text-lg max-w-2xl mx-auto">
              Stop switching between tools. Design, iterate, and ship code — all in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Design',
                desc: 'Create beautiful interfaces with familiar design tools. Infinite canvas, components, auto-layout, and more.',
                gradient: 'from-[#6366f1] to-[#8b5cf6]',
              },
              {
                step: '02',
                title: 'Iterate with AI',
                desc: 'Refine your design with natural language. Get instant feedback, try variations, and polish every detail.',
                gradient: 'from-[#8b5cf6] to-[#ec4899]',
              },
              {
                step: '03',
                title: 'Ship Code',
                desc: 'Export production-ready React, Vue, or HTML. Clean code that matches your design pixel-for-pixel.',
                gradient: 'from-[#ec4899] to-[#f59e0b]',
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className={`text-6xl font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent mb-4`}>
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-[#737373] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: 10, suffix: 'K+', label: 'GitHub Stars' },
              { value: 50, suffix: '+', label: 'Open Source Contributors' },
              { value: 100, suffix: '%', label: 'Open Source (AGPL-3.0)' },
              { value: 0, suffix: '', label: 'Vendor Lock-In' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl font-bold text-[#6366f1] mb-2">
                  {stat.value > 0 ? <AnimatedCounter target={stat.value} suffix={stat.suffix} /> : 'Zero'}
                </div>
                <div className="text-sm text-[#737373]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#fafafa] border-y border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Loved by designers who ship
            </h2>
            <p className="text-[#737373] text-lg">
              Join the community building the future of open-source design.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Finally, a design tool that generates clean code. We cut our design-to-dev handoff time by 80%.",
                name: 'Sarah Chen',
                role: 'Lead Designer, TechFlow',
              },
              {
                quote: "The AI agent is incredible. I describe a UI, and it builds it right on the canvas. It's like having a design partner.",
                name: 'Marcus Rodriguez',
                role: 'Frontend Engineer, BuildKit',
              },
              {
                quote: "Open source, self-hostable, and the code generation is actually production-quality. Switched from Figma immediately.",
                name: 'Priya Sharma',
                role: 'CTO, DevStudio',
              },
            ].map((testimonial, i) => (
              <div key={i} className="p-6 bg-white rounded-2xl border border-[#e5e5e5] shadow-sm">
                <div className="flex gap-1 mb-4 text-[#f59e0b]">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#171717] mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-sm font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{testimonial.name}</div>
                    <div className="text-xs text-[#737373]">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Start designing today
          </h2>
          <p className="text-lg text-[#737373] mb-10 max-w-xl mx-auto">
            Free and open source. No credit card required. Start shipping beautiful UIs in minutes.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl font-medium text-base shadow-xl shadow-[#6366f1]/25 transition-all hover:shadow-2xl hover:shadow-[#6366f1]/35"
          >
            <PlusIcon size={18} />
            Open Koda
            <ChevronRightIcon size={16} className="opacity-50 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <p className="mt-6 text-sm text-[#737373]">
            Open source under AGPL-3.0. Self-host or use the cloud.
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#e5e5e5] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 bg-[#6366f1] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">K</span>
                </div>
                <span className="text-sm font-bold tracking-tight text-[#171717]">Koda</span>
              </div>
              <p className="text-sm text-[#737373] leading-relaxed">
                Open-source design tool that generates pixel-perfect code.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-2.5">
                {['Features', 'Pricing', 'Changelog', 'Roadmap', 'Self-Host'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-[#737373] hover:text-[#171717] transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Resources</h4>
              <ul className="space-y-2.5">
                {['Documentation', 'Tutorials', 'Blog', 'Community', 'Plugins'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-[#737373] hover:text-[#171717] transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Developers */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Developers</h4>
              <ul className="space-y-2.5">
                {['API Reference', 'GitHub', 'Contributing', 'License'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-[#737373] hover:text-[#171717] transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold mb-4">Company</h4>
              <ul className="space-y-2.5">
                {['About', 'Careers', 'Contact', 'Security'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-[#737373] hover:text-[#171717] transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-[#e5e5e5]">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#737373]">
              &copy; {new Date().getFullYear()} GetKoda. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-[#737373]">
              <a href="#" className="hover:text-[#171717] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#171717] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#171717] transition-colors">License</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
