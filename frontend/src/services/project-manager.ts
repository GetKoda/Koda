// ============================================================================
// Project Manager — localStorage persistence + RBAC
// ============================================================================

import type { KodaDocument } from '@shared/types';

// ── Types ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Collaborator {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
}

export type Permission = 'owner' | 'editor' | 'viewer';

export interface ProjectMeta {
  id: string;
  name: string;
  folderId: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  collaborators: Collaborator[];
}

export interface FolderMeta {
  id: string;
  name: string;
  parentId: string | null;
  ownerId: string;
  createdAt: string;
}

const PROJECTS_KEY = 'koda_projects';
const FOLDERS_KEY = 'koda_folders';
const USER_KEY = 'koda_current_user';

// ── Current User ─────────────────────────────────────────────────────────

export function getCurrentUser(): User {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const user: User = {
    id: `user_${Date.now()}`,
    name: 'You',
    email: 'you@example.com',
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ── Helpers ──────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readJson<T>(key: string): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : ({} as T);
  } catch {
    return {} as T;
  }
}

function writeJson<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── RBAC ─────────────────────────────────────────────────────────────────

export function getProjectPermission(project: ProjectMeta, userId: string): Permission {
  const collaborator = project.collaborators.find((c) => c.userId === userId);
  return collaborator?.role ?? 'viewer';
}

export function canEdit(project: ProjectMeta, userId: string): boolean {
  const perm = getProjectPermission(project, userId);
  return perm === 'owner' || perm === 'editor';
}

export function canDelete(project: ProjectMeta, userId: string): boolean {
  return getProjectPermission(project, userId) === 'owner';
}

export function addCollaborator(projectId: string, userId: string, role: 'editor' | 'viewer'): void {
  const all = readJson<Record<string, any>>(PROJECTS_KEY);
  if (all[projectId]) {
    const existing = all[projectId].collaborators || [];
    const idx = existing.findIndex((c: any) => c.userId === userId);
    if (idx >= 0) {
      existing[idx].role = role;
    } else {
      existing.push({ userId, role });
    }
    all[projectId].collaborators = existing;
    writeJson(PROJECTS_KEY, all);
  }
}

export function removeCollaborator(projectId: string, userId: string): void {
  const all = readJson<Record<string, any>>(PROJECTS_KEY);
  if (all[projectId]) {
    all[projectId].collaborators = (all[projectId].collaborators || []).filter(
      (c: any) => c.userId !== userId
    );
    writeJson(PROJECTS_KEY, all);
  }
}

// ── Projects ─────────────────────────────────────────────────────────────

export function listProjects(): ProjectMeta[] {
  const all = readJson<Record<string, KodaDocument>>(PROJECTS_KEY);
  const user = getCurrentUser();
  return Object.values(all)
    .filter((doc: any) => {
      if ((doc as any).ownerId === user.id) return true;
      const collabs = (doc as any).collaborators || [];
      return collabs.some((c: any) => c.userId === user.id);
    })
    .map((doc) => ({
      id: doc.id,
      name: doc.name,
      folderId: (doc as any).folderId ?? null,
      thumbnail: null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      ownerId: (doc as any).ownerId ?? user.id,
      collaborators: (doc as any).collaborators ?? [],
    }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getProject(id: string): KodaDocument | null {
  const all = readJson<Record<string, KodaDocument>>(PROJECTS_KEY);
  return all[id] ?? null;
}

export function saveProject(doc: KodaDocument): void {
  const all = readJson<Record<string, KodaDocument>>(PROJECTS_KEY);
  all[doc.id] = { ...doc, updatedAt: new Date().toISOString() };
  writeJson(PROJECTS_KEY, all);
}

export function deleteProject(id: string): void {
  const all = readJson<Record<string, KodaDocument>>(PROJECTS_KEY);
  delete all[id];
  writeJson(PROJECTS_KEY, all);
}

export function createNewProject(name: string, folderId?: string | null): KodaDocument {
  const user = getCurrentUser();
  const id = generateId('proj');
  const doc: any = {
    id,
    name,
    version: '1.0',
    root: {
      id: `root_${id}`,
      name: 'Page 1',
      type: 'canvas',
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal',
      x: -5000,
      y: -5000,
      width: 10000,
      height: 10000,
      rotation: 0,
      cornerRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
      fills: [],
      strokes: [],
      effects: [],
      layout: {
        mode: 'none',
        direction: 'column',
        wrap: 'nowrap',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        gap: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        itemSpacing: 0,
      },
      sizeConstraint: { widthSizing: 'fixed', heightSizing: 'fixed' },
      constraints: { horizontal: 'left', vertical: 'top' },
      children: [],
    },
    components: [],
    componentDefs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    folderId: folderId ?? null,
    ownerId: user.id,
    collaborators: [{ userId: user.id, role: 'owner' }],
  };
  saveProject(doc as KodaDocument);
  return doc as KodaDocument;
}

export function moveToFolder(projectId: string, folderId: string | null): void {
  const all = readJson<Record<string, any>>(PROJECTS_KEY);
  if (all[projectId]) {
    all[projectId].folderId = folderId;
    writeJson(PROJECTS_KEY, all);
  }
}

// ── Folders ──────────────────────────────────────────────────────────────

export function listFolders(): FolderMeta[] {
  const all = readJson<Record<string, FolderMeta>>(FOLDERS_KEY);
  const user = getCurrentUser();
  return Object.values(all)
    .filter((f) => f.ownerId === user.id)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function createFolder(name: string, parentId?: string | null): FolderMeta {
  const user = getCurrentUser();
  const id = generateId('folder');
  const folder: FolderMeta = {
    id,
    name,
    parentId: parentId ?? null,
    ownerId: user.id,
    createdAt: new Date().toISOString(),
  };
  const all = readJson<Record<string, FolderMeta>>(FOLDERS_KEY);
  all[id] = folder;
  writeJson(FOLDERS_KEY, all);
  return folder;
}

export function renameFolder(id: string, name: string): void {
  const all = readJson<Record<string, FolderMeta>>(FOLDERS_KEY);
  if (all[id]) {
    all[id].name = name;
    writeJson(FOLDERS_KEY, all);
  }
}

export function deleteFolder(id: string): void {
  const all = readJson<Record<string, FolderMeta>>(FOLDERS_KEY);
  delete all[id];
  writeJson(FOLDERS_KEY, all);

  const projects = readJson<Record<string, any>>(PROJECTS_KEY);
  for (const proj of Object.values(projects)) {
    if (proj.folderId === id) {
      proj.folderId = null;
    }
  }
  writeJson(PROJECTS_KEY, projects);
}
