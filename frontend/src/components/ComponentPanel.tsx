import { useState } from 'react';
import { useEditorStore } from '@/store';
import type { ComponentDefinition } from '@shared/types';
import {
  PlusIcon, SearchIcon, ChevronDownIcon, ChevronRightIcon,
  LayersIcon,
} from './icons';

export function ComponentPanel() {
  const { document, createComponent, select, selectedIds } = useEditorStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['All']));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCompName, setNewCompName] = useState('');

  const componentDefs: ComponentDefinition[] = document?.componentDefs || [];

  const filteredComponents = componentDefs.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const categories = new Map<string, ComponentDefinition[]>();
  for (const comp of filteredComponents) {
    const cat = comp.category || 'Uncategorized';
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(comp);
  }

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpandedCategories(next);
  };

  const handleCreate = () => {
    if (!newCompName.trim()) return;

    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      // Create empty component
      const def = createComponent(newCompName.trim(), []);
      if (def) setShowCreateDialog(false);
    } else {
      const def = createComponent(newCompName.trim(), ids);
      if (def) setShowCreateDialog(false);
    }
    setNewCompName('');
  };

  return (
    <div className="w-60 h-full bg-koda-surface border-l border-koda-border flex flex-col">
      {/* Header */}
      <div className="h-10 border-b border-koda-border flex items-center justify-between px-3">
        <span className="text-xs font-semibold">Components</span>
        <button
          onClick={() => setShowCreateDialog(!showCreateDialog)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-koda-text-secondary hover:bg-koda-border transition-colors"
        >
          <PlusIcon size={12} />
        </button>
      </div>

      {/* Create dialog */}
      {showCreateDialog && (
        <div className="p-3 border-b border-koda-border">
          <div className="text-2xs text-koda-text-secondary mb-2">
            {selectedIds.size > 0
              ? `Create component from ${selectedIds.size} selected node(s)`
              : 'Create empty component'}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCompName}
              onChange={(e) => setNewCompName(e.target.value)}
              placeholder="Component name"
              className="flex-1 bg-koda-bg border border-koda-border rounded-lg px-3 py-1.5 text-xs text-koda-text
                         placeholder:text-koda-text-secondary/50 focus:outline-none focus:border-koda-accent"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              className="px-3 py-1.5 bg-koda-accent text-white text-xs rounded-lg hover:bg-koda-accent-hover transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="p-2">
        <div className="relative">
          <SearchIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-koda-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full bg-koda-bg border border-koda-border rounded-lg pl-7 pr-3 py-1.5 text-xs text-koda-text
                       placeholder:text-koda-text-secondary/50 focus:outline-none focus:border-koda-accent"
          />
        </div>
      </div>

      {/* Component list */}
      <div className="flex-1 overflow-y-auto px-1">
        {componentDefs.length === 0 ? (
          <div className="p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-koda-border/50 flex items-center justify-center mx-auto mb-3">
              <LayersIcon size={18} className="text-koda-text-secondary" />
            </div>
            <p className="text-xs text-koda-text-secondary mb-1">No components yet</p>
            <p className="text-2xs text-koda-text-secondary">
              Select nodes and click + to create a component
            </p>
          </div>
        ) : (
          Array.from(categories.entries()).map(([cat, comps]) => (
            <div key={cat} className="mb-1">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-2xs font-medium text-koda-text-secondary hover:text-koda-text transition-colors"
              >
                {expandedCategories.has(cat)
                  ? <ChevronDownIcon size={10} />
                  : <ChevronRightIcon size={10} />
                }
                {cat}
                <span className="ml-auto text-koda-text-secondary/50">{comps.length}</span>
              </button>

              {expandedCategories.has(cat) && (
                <div className="ml-2">
                  {comps.map((comp) => (
                    <button
                      key={comp.id}
                      onClick={() => select(comp.masterNodeId)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-koda-text
                                 hover:bg-koda-border transition-colors group"
                    >
                      <div className="w-5 h-5 rounded bg-koda-accent/10 flex items-center justify-center flex-shrink-0">
                        <LayersIcon size={10} className="text-koda-accent" />
                      </div>
                      <span className="flex-1 text-left truncate">{comp.name}</span>
                      {comp.properties.length > 0 && (
                        <span className="text-2xs text-koda-text-secondary/50">
                          {comp.properties.length} props
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
