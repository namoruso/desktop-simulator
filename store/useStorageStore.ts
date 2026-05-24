import { create } from 'zustand';
import type { StorageSnapshot, FileEntry } from '@/types/storage.types';

interface Clipboard {
  path: string;
  name: string;
  isDirectory: boolean;
}

interface StorageStore {
  snapshot: StorageSnapshot | null;
  currentPath: string | null;
  entries: FileEntry[];
  parentPath: string | null;
  selected: FileEntry | null;
  clipboard: Clipboard | null;
  loading: boolean;
  error: string | null;
  preview: string | null;
  toast: string | null;
  setSnapshot: (s: StorageSnapshot) => void;
  clearToast: () => void;
  scan: () => Promise<void>;
  openPath: (path: string) => Promise<void>;
  selectEntry: (entry: FileEntry | null) => void;
  copyToClipboard: (entry: FileEntry) => void;
  paste: () => Promise<void>;
  transferTo: (destDir: string) => Promise<void>;
  mkdir: (name: string) => Promise<void>;
  loadPreview: (entry: FileEntry) => Promise<void>;
}

export const useStorageStore = create<StorageStore>((set, get) => ({
  snapshot: null,
  currentPath: null,
  entries: [],
  parentPath: null,
  selected: null,
  clipboard: null,
  loading: false,
  error: null,
  preview: null,
  toast: null,

  setSnapshot: (snapshot) => set({ snapshot }),
  clearToast: () => set({ toast: null }),

  scan: async () => {
    try {
      const res = await fetch('/api/storage', { cache: 'no-store' });
      if (!res.ok) throw new Error('Storage scan failed');
      const snapshot: StorageSnapshot = await res.json();
      set({ snapshot });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Scan failed' });
    }
  },

  openPath: async (path) => {
    set({ loading: true, error: null, preview: null });
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cannot open folder');
      set({
        currentPath: data.path,
        parentPath: data.parent,
        entries: data.entries,
        loading: false,
        selected: null,
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Failed',
      });
    }
  },

  selectEntry: (entry) => set({ selected: entry, preview: null }),

  copyToClipboard: (entry) =>
    set({
      clipboard: {
        path: entry.path,
        name: entry.name,
        isDirectory: entry.isDirectory,
      },
    }),

  paste: async () => {
    const { clipboard, currentPath } = get();
    if (!clipboard || !currentPath) return;
    set({ loading: true });
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copy',
          from: clipboard.path,
          toDir: currentPath,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await get().openPath(currentPath);
      set({ loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Paste failed',
      });
    }
  },

  transferTo: async (destDir) => {
    const { selected, currentPath } = get();
    if (!selected || !currentPath) return;
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copy',
          from: selected.path,
          toDir: destDir,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set({ loading: false, toast: `Copied to ${data.dest}` });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Transfer failed',
      });
    }
  },

  mkdir: async (name) => {
    const { currentPath } = get();
    if (!currentPath) return;
    const res = await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mkdir', path: currentPath, name }),
    });
    if (res.ok) await get().openPath(currentPath);
  },

  loadPreview: async (entry) => {
    if (entry.isDirectory) {
      set({ preview: null });
      return;
    }
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', path: entry.path }),
      });
      const data = await res.json();
      if (res.ok) set({ preview: data.content });
      else set({ preview: `[Binary or large file: ${data.error}]` });
    } catch {
      set({ preview: '[Cannot preview]' });
    }
  },
}));
