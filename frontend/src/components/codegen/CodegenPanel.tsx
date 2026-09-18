// ============================================================================
// Codegen Panel — Select framework, generate code, view output
// ============================================================================

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/store';
import { apiClient } from '@/services/api-client';
import type { CodegenResponse } from '@/services/types';

const frameworks = [
  { id: 'react' as const, label: 'React', icon: '⚛', desc: 'React + TypeScript' },
  { id: 'vue' as const, label: 'Vue', icon: '◆', desc: 'Vue 3 + TypeScript' },
  { id: 'html-css' as const, label: 'HTML/CSS', icon: '◇', desc: 'Semantic HTML + CSS' },
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
        framework,
        cssFramework,
        typescript,
      });
      setResult(response);
      if (response.files.length > 0) {
        setSelectedFile(response.files[0].path);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }, [document, selectedFrameId, framework, cssFramework, typescript]);

  if (!showCodegen) return null;

  return (
    <div className="w-96 bg-koda-surface border-l border-koda-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-koda-border flex items-center justify-between">
        <span className="text-sm font-semibold text-koda-text">Generate Code</span>
        <button onClick={toggleCodegen} className="text-koda-text-secondary hover:text-koda-text text-lg">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Framework Selection */}
        <div className="p-4 border-b border-koda-border">
          <label className="text-2xs text-koda-text-secondary uppercase tracking-wider mb-2 block">
            Framework
          </label>
          <div className="grid grid-cols-3 gap-2">
            {frameworks.map((fw) => (
              <button
                key={fw.id}
                onClick={() => setFramework(fw.id)}
                className={`
                  p-3 rounded-lg border text-center transition-all
                  ${framework === fw.id
                    ? 'border-koda-accent bg-koda-accent/10 text-koda-accent'
                    : 'border-koda-border text-koda-text-secondary hover:border-koda-border-hover hover:text-koda-text'
                  }
                `}
              >
                <div className="text-lg mb-1">{fw.icon}</div>
                <div className="text-xs font-medium">{fw.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* CSS Framework */}
        <div className="p-4 border-b border-koda-border">
          <label className="text-2xs text-koda-text-secondary uppercase tracking-wider mb-2 block">
            CSS Framework
          </label>
          <div className="grid grid-cols-2 gap-2">
            {cssFrameworks.map((cf) => (
              <button
                key={cf.id}
                onClick={() => setCssFramework(cf.id)}
                className={`
                  px-3 py-2 rounded-md text-xs transition-all
                  ${cssFramework === cf.id
                    ? 'bg-koda-accent/20 text-koda-accent border border-koda-accent/50'
                    : 'bg-koda-surface text-koda-text-secondary border border-koda-border hover:border-koda-border-hover'
                  }
                `}
              >
                {cf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="p-4 border-b border-koda-border">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={typescript}
              onChange={(e) => setTypescript(e.target.checked)}
              className="rounded border-koda-border"
            />
            <span className="text-xs text-koda-text">TypeScript</span>
          </label>
        </div>

        {/* Generate Button */}
        <div className="p-4">
          <button
            onClick={handleGenerate}
            disabled={generating || selectedIds.size === 0}
            className={`
              w-full py-3 rounded-lg font-medium text-sm transition-all
              ${generating
                ? 'bg-koda-accent/50 text-white/50 cursor-wait'
                : selectedIds.size === 0
                  ? 'bg-koda-border text-koda-text-secondary cursor-not-allowed'
                  : 'bg-koda-accent hover:bg-koda-accent-hover text-white shadow-lg shadow-koda-accent/20'
              }
            `}
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⟳</span> Generating...
              </span>
            ) : selectedIds.size === 0 ? (
              'Select a frame to generate'
            ) : (
              'Generate Code'
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 p-3 bg-koda-error/10 border border-koda-error/30 rounded-lg text-koda-error text-xs">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="border-t border-koda-border">
            {/* Stats */}
            <div className="p-4 border-b border-koda-border">
              <div className="flex items-center gap-4 text-2xs text-koda-text-secondary">
                <span>{result.stats.totalFiles} files</span>
                <span>{result.stats.totalLines} lines</span>
                <span>{result.stats.generationTime}ms</span>
                <span>{result.stats.componentsGenerated} components</span>
              </div>
            </div>

            {/* File Tabs */}
            <div className="flex overflow-x-auto border-b border-koda-border">
              {result.files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file.path)}
                  className={`
                    px-3 py-2 text-2xs whitespace-nowrap border-b-2 transition-colors
                    ${selectedFile === file.path
                      ? 'border-koda-accent text-koda-accent bg-koda-accent/5'
                      : 'border-transparent text-koda-text-secondary hover:text-koda-text'
                    }
                  `}
                >
                  {file.path.split('/').pop()}
                </button>
              ))}
            </div>

            {/* Code Preview */}
            {selectedFile && (
              <div className="p-4">
                <pre className="bg-koda-bg rounded-lg p-4 overflow-x-auto text-xs font-mono text-koda-text leading-relaxed border border-koda-border">
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


