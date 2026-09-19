// ============================================================================
// Project Dashboard — Sidebar layout with folders, projects, and RBAC
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listProjects, createNewProject, deleteProject,
  listFolders, createFolder, deleteFolder,
  type ProjectMeta, type FolderMeta,
  getCurrentUser, type User,
} from '@/services/project-manager';
import {
  PlusIcon, TrashIcon, CopyIcon, FolderIcon, ChevronRightIcon,
  ChevronDownIcon, FileIcon,
} from './icons';

// ── Sidebar Folder Item ──────────────────────────────────────────────────

function FolderItem({
  folder,
  projects,
  selectedFolder,
  onSelect,
  onDelete,
  onNewProject,
  depth = 0,
}: {
  folder: FolderMeta;
  projects: ProjectMeta[];
  selectedFolder: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onNewProject: (folderId: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const folderProjects = projects.filter((p) => p.folderId === folder.id);
  const isSelected = selectedFolder === folder.id;

  return (
    <div>
      <div
        className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors
          ${isSelected ? 'bg-koda-accent/15 text-koda-accent' : 'text-koda-text-secondary hover:bg-koda-border/50 hover:text-koda-text'}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(isSelected ? null : folder.id)}
      >
        <button
          className="w-4 h-4 flex items-center justify-center shrink-0"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {expanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
        </button>
        <FolderIcon size={14} className="text-[#f59e0b] shrink-0" />
        <span className="text-sm truncate flex-1">{folder.name}</span>
        <span className="text-2xs text-koda-text-secondary mr-1">{folderProjects.length}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onNewProject(folder.id); }}
          className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 text-koda-text-secondary hover:text-koda-text hover:bg-koda-border transition-all"
          title="New Project"
        >
          <PlusIcon size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}
          className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 text-koda-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-all"
          title="Delete Folder"
        >
          <TrashIcon size={12} />
        </button>
      </div>

      {expanded && folderProjects.map((project) => (
        <ProjectItem key={project.id} project={project} depth={depth + 1} />
      ))}
    </div>
  );
}

// ── Sidebar Project Item ─────────────────────────────────────────────────

function ProjectItem({ project, depth }: { project: ProjectMeta; depth: number }) {
  const navigate = useNavigate();

  return (
    <div
      className="group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-koda-text-secondary hover:bg-koda-border/50 hover:text-koda-text transition-colors"
      style={{ paddingLeft: `${depth * 16 + 28}px` }}
      onClick={() => navigate(`/editor/${project.id}`)}
    >
      <FileIcon size={14} className="shrink-0" />
      <span className="text-sm truncate flex-1">{project.name}</span>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────

export function ProjectDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [folders, setFolders] = useState<FolderMeta[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState<'project' | 'folder' | null>(null);
  const [newName, setNewName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'project' | 'folder'; id: string } | null>(null);
  const [user] = useState<User>(getCurrentUser);

  const refresh = useCallback(() => {
    setProjects(listProjects());
    setFolders(listFolders());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreateProject = () => {
    const name = newName.trim() || 'Untitled Project';
    const folderId = selectedFolder || folders[0]?.id;
    if (!folderId) {
      setShowNewModal('folder');
      return;
    }
    const doc = createNewProject(name, folderId);
    setNewName('');
    setShowNewModal(null);
    navigate(`/editor/${doc.id}`);
  };

  const handleCreateFolder = () => {
    const name = newName.trim() || 'New Folder';
    createFolder(name);
    setNewName('');
    setShowNewModal(null);
    refresh();
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'project') {
      deleteProject(confirmDelete.id);
    } else {
      deleteFolder(confirmDelete.id);
    }
    setConfirmDelete(null);
    refresh();
  };

  const handleDuplicate = (meta: ProjectMeta) => {
    createNewProject(`${meta.name} Copy`, meta.folderId);
    refresh();
  };

  const filteredProjects = selectedFolder
    ? projects.filter((p) => p.folderId === selectedFolder)
    : projects;

  const displayProjects = selectedFolder ? filteredProjects : projects;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="h-screen w-screen flex bg-koda-bg text-koda-text overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <div className="w-60 bg-koda-surface border-r border-koda-border flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-12 flex items-center px-4 border-b border-koda-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#6366f1] rounded-md flex items-center justify-center">
              <span className="text-white text-2xs font-bold">K</span>
            </div>
            <span className="text-sm font-bold tracking-tight">Koda</span>
          </div>
        </div>

        {/* Folders tree */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-2xs font-semibold text-koda-text-secondary uppercase tracking-wider">Workspace</span>
            <button
              onClick={() => setShowNewModal('folder')}
              className="w-5 h-5 rounded flex items-center justify-center text-koda-text-secondary hover:text-koda-text hover:bg-koda-border transition-colors"
              title="New Folder"
            >
              <PlusIcon size={12} />
            </button>
          </div>

          {folders.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-2xs text-koda-text-secondary mb-2">No folders yet</p>
              <button
                onClick={() => setShowNewModal('folder')}
                className="text-2xs text-koda-accent hover:underline"
              >
                Create one
              </button>
            </div>
          ) : (
            folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                projects={projects}
                selectedFolder={selectedFolder}
                onSelect={setSelectedFolder}
                onDelete={(id) => setConfirmDelete({ type: 'folder', id })}
                onNewProject={(folderId) => {
                  setSelectedFolder(folderId);
                  setShowNewModal('project');
                }}
              />
            ))
          )}
        </div>

        {/* User info */}
        <div className="border-t border-koda-border p-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-koda-accent/20 flex items-center justify-center text-koda-accent text-xs font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-2xs text-koda-text-secondary truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-12 flex items-center justify-between px-6 border-b border-koda-border bg-koda-surface">
          <h1 className="text-sm font-semibold">
            {selectedFolder
              ? folders.find((f) => f.id === selectedFolder)?.name || 'Folder'
              : 'All Projects'}
          </h1>
          <div className="flex items-center gap-3">
            {selectedFolder && (
              <button
                onClick={() => setSelectedFolder(null)}
                className="text-xs text-koda-text-secondary hover:text-koda-text transition-colors"
              >
                View All
              </button>
            )}
            <button
              onClick={() => setShowNewModal('project')}
              className="flex items-center gap-2 px-4 py-1.5 bg-koda-accent hover:bg-koda-accent-hover text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <PlusIcon size={14} />
              New Project
            </button>
          </div>
        </div>

        {/* Projects grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {displayProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-16 h-16 rounded-2xl bg-koda-surface border border-koda-border flex items-center justify-center mb-4">
                <PlusIcon size={24} className="text-koda-text-secondary" />
              </div>
              <h2 className="text-lg font-semibold mb-1">
                {selectedFolder ? 'No projects in this folder' : 'No projects yet'}
              </h2>
              <p className="text-sm text-koda-text-secondary mb-4">
                {selectedFolder ? 'Create a project in this folder.' : 'Create a folder first, then add projects.'}
              </p>
              {folders.length > 0 ? (
                <button
                  onClick={() => setShowNewModal('project')}
                  className="flex items-center gap-2 px-5 py-2 bg-koda-accent hover:bg-koda-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <PlusIcon size={14} />
                  New Project
                </button>
              ) : (
                <button
                  onClick={() => setShowNewModal('folder')}
                  className="flex items-center gap-2 px-5 py-2 bg-koda-accent hover:bg-koda-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <FolderIcon size={14} />
                  Create Folder
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {displayProjects.map((project) => (
                <div
                  key={project.id}
                  className="group relative h-52 rounded-xl bg-koda-surface border border-koda-border hover:border-koda-border-hover overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => navigate(`/editor/${project.id}`)}
                >
                  <div className="h-36 bg-koda-bg flex items-center justify-center">
                    <div className="w-20 h-14 rounded-lg bg-koda-border/30 flex items-center justify-center">
                      <span className="text-2xl font-bold text-koda-border/50">
                        {project.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-2 border-t border-koda-border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium truncate flex-1">{project.name}</h3>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDuplicate(project); }}
                          className="w-5 h-5 rounded flex items-center justify-center text-koda-text-secondary hover:text-koda-text hover:bg-koda-border transition-colors"
                        >
                          <CopyIcon size={11} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'project', id: project.id }); }}
                          className="w-5 h-5 rounded flex items-center justify-center text-koda-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <TrashIcon size={11} />
                        </button>
                      </div>
                    </div>
                    <p className="text-2xs text-koda-text-secondary mt-0.5">
                      {formatDate(project.updatedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-koda-surface border border-koda-border rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              {showNewModal === 'folder' ? 'New Folder' : 'New Project'}
            </h2>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  showNewModal === 'folder' ? handleCreateFolder() : handleCreateProject();
                }
              }}
              placeholder={showNewModal === 'folder' ? 'Folder name' : 'Project name'}
              className="w-full bg-koda-bg border border-koda-border rounded-lg px-4 py-2.5 text-sm text-koda-text
                         placeholder:text-koda-text-secondary/50 focus:outline-none focus:border-koda-accent mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowNewModal(null); setNewName(''); }}
                className="px-4 py-2 text-sm text-koda-text-secondary hover:text-koda-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showNewModal === 'folder' ? handleCreateFolder : handleCreateProject}
                className="px-5 py-2 bg-koda-accent hover:bg-koda-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-koda-surface border border-koda-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-2">
              Delete {confirmDelete.type === 'folder' ? 'Folder' : 'Project'}?
            </h2>
            <p className="text-sm text-koda-text-secondary mb-6">
              {confirmDelete.type === 'folder'
                ? 'Projects in this folder will be moved to the root.'
                : 'This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-koda-text-secondary hover:text-koda-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
