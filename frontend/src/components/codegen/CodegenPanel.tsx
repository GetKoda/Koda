import { useState, useCallback } from 'react';
import { useEditorStore } from '@/store';
import { apiClient } from '@/services/api-client';
import type { CodegenResponse } from '@/services/types';
import { CloseIcon, SparklesIcon, CodeIcon } from '../icons';

const frameworks = [
  { id: 'react' as const, label: 'React', desc: 'React + TypeScript' },
  { id: 'vue' as const, label: 'Vue', desc: 'Vue 3 + TypeScript' },
  { id: 'html-css' as const, label: 'HTML/CSS', desc: 'Semantic HTML + CSS' },
];

const cssFrameworks = [
  { id: 'tailwind' as const, label: 'Tailwind' },
  { id: 'css-modules' as const, label: 'CSS Modules' },
  { id: 'scss' as const, label: 'SCSS' },
  { id: 'vanilla' as const, label: 'Vanilla CSS' },
];

export function CodegenPanel() {
  const { document, selectedIds, showCodegen, toggleCodegen } = useEditorStore();
  const [framework, setFramework] = useState<'react' | 'vue' | 'html-css'>('react');
  const [cssFramework, setCssFramework] = useState<'tailwind' | 'css-modules' | 'scss' | 'vanilla'>('tailwind');
  const [typescript, setTypescript] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<CodegenResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedFrameId = Array.from(selectedIds)[0];

  const handleGenerate = useCallback(async () => {
    if (!document || !selectedFrameId) {
      setError('Select a frame or component first');
      return;
    }
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const response = await apiClient.generateCode(document, selectedFrameId, {
        framework, cssFramework, typescript,
      });
      setResult(response);
      if (response.files.length > 0) setSelectedFile(response.files[0].path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }, [document, selectedFrameId, framework, cssFramework, typescript]);

  if (!showCodegen) return null;

  return (
    <div className="w-96 bg-koda-surface border-l border-koda-border flex flex-col overflow-hidden">
      <div className="h-10 px-4 flex items-center justify-between border-b border-koda-border">
        <div className="flex items-center gap-2">
          <CodeIcon size={14} className="text-koda-accent" />
          <span className="text-sm font-semibold text-koda-text">Generate Code</span>
        </div>
        <button onClick={toggleCodegen} className="w-6 h-6 rounded flex items-center justify-center text-koda-text-secondary hover:bg-koda-border">
          <CloseIcon size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-koda-border">
          <label className="text-2xs text-koda-text-secondary uppercase tracking-wider mb-2 block">Framework</label>
          <div className="grid grid-cols-3 gap-2">
            {frameworks.map((fw) => (
              <button
                key={fw.id}
                onClick={() => setFramework(fw.id)}
                className={`p-3 rounded-lg border text-center transition-all
                  ${framework === fw.id
                    ? 'border-koda-accent bg-koda-accent/10 text-koda-accent'
                    : 'border-koda-border text-koda-text-secondary hover:border-koda-border-hover hover:text-koda-text'
                  }`}
              >
                <div className="text-xs font-medium">{fw.label}</div>
                <div className="text-2xs text-koda-text-secondary mt-0.5">{fw.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-b border-koda-border">
          <label className="text-2xs text-koda-text-secondary uppercase tracking-wider mb-2 block">CSS Framework</label>
          <div className="grid grid-cols-2 gap-2">
            {cssFrameworks.map((cf) => (
              <button
                key={cf.id}
                onClick={() => setCssFramework(cf.id)}
                className={`px-3 py-2 rounded-md text-xs transition-all
                  ${cssFramework === cf.id
                    ? 'bg-koda-accent/20 text-koda-accent border border-koda-accent/50'
                    : 'bg-koda-surface text-koda-text-secondary border border-koda-border hover:border-koda-border-hover'
                  }`}
              >
                {cf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-b border-koda-border">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={typescript} onChange={(e) => setTypescript(e.target.checked)} className="rounded border-koda-border" />
            <span className="text-xs text-koda-text">TypeScript</span>
          </label>
        </div>

        <div className="p-4">
          <button
            onClick={handleGenerate}
            disabled={generating || selectedIds.size === 0}
            className={`w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2
              ${generating
                ? 'bg-koda-accent/50 text-white/50 cursor-wait'
                : selectedIds.size === 0
                  ? 'bg-koda-border text-koda-text-secondary cursor-not-allowed'
                  : 'bg-koda-accent hover:bg-koda-accent-hover text-white shadow-lg shadow-koda-accent/20'
              }`}
          >
            {generating ? (
              <><span className="animate-spin">&#8635;</span> Generating...</>
            ) : selectedIds.size === 0 ? (
              'Select a frame to generate'
            ) : (
              <><SparklesIcon size={14} /> Generate Code</>
            )}
          </button>
        </div>

        {error && (
          <div className="mx-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">{error}</div>
        )}

        {result && (
          <div className="border-t border-koda-border">
            <div className="p-4 border-b border-koda-border">
              <div className="flex items-center gap-4 text-2xs text-koda-text-secondary">
                <span>{result.stats.totalFiles} files</span>
                <span>{result.stats.totalLines} lines</span>
                <span>{result.stats.generationTime}ms</span>
              </div>
            </div>

            <div className="flex overflow-x-auto border-b border-koda-border">
              {result.files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file.path)}
                  className={`px-3 py-2 text-2xs whitespace-nowrap border-b-2 transition-colors
                    ${selectedFile === file.path
                      ? 'border-koda-accent text-koda-accent bg-koda-accent/5'
                      : 'border-transparent text-koda-text-secondary hover:text-koda-text'
                    }`}
                >
                  {file.path.split('/').pop()}
                </button>
              ))}
            </div>

            {selectedFile && (
              <div className="p-4">
                <pre className="bg-koda-bg rounded-lg p-4 overflow-x-auto text-xs font-mono text-koda-text leading-relaxed border border-koda-border max-h-96">
                  <code>{result.files.find((f) => f.path === selectedFile)?.content}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
