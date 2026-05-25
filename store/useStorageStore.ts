import { create } from 'zustand';
import type { StorageSnapshot, FileEntry } from '@/types/storage.types';
import { useToastStore } from '@/store/useToastStore';
import { notifyFileIoComplete } from '@/lib/fileIoNotify';

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
  setSnapshot: (s: StorageSnapshot) => void;
  scan: (opts?: { silent?: boolean }) => Promise<void>;
  openPath: (path: string) => Promise<void>;
  selectEntry: (entry: FileEntry | null) => void;
  copyToClipboard: (entry: FileEntry) => void;
  paste: () => Promise<void>;
  transferTo: (destDir: string) => Promise<void>;
  mkdir: (name: string) => Promise<void>;
  removeSelected: () => Promise<void>;
  renameSelected: (newName: string) => Promise<void>;
  moveEntry: (from: string, toDir: string) => Promise<void>;
  uploadFiles: (files: File[], destDir: string) => Promise<void>;
  loadPreview: (entry: FileEntry) => Promise<void>;
}

async function postFiles(body: Record<string, unknown>) {
  const res = await fetch('/api/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Operation failed');
  return data;
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

  setSnapshot: (snapshot) => set({ snapshot, error: null }),

  scan: async (opts) => {
    const silent = opts?.silent ?? false;
    const existing = get().snapshot;
    try {
      const res = await fetch('/api/storage', { cache: 'no-store' });
      if (!res.ok) throw new Error('Storage scan failed');
      const snapshot: StorageSnapshot = await res.json();
      set({ snapshot, error: null });
    } catch (e) {
      if (existing) {
        return;
      }
      const msg = e instanceof Error ? e.message : 'Scan failed';
      set({ error: msg });
      if (!silent) {
        useToastStore.getState().push(msg, 'error');
      }
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
      const msg = e instanceof Error ? e.message : 'Failed';
      set({ loading: false, error: msg });
    }
  },

  selectEntry: (entry) => set({ selected: entry, preview: null }),

  copyToClipboard: (entry) => {
    set({
      clipboard: {
        path: entry.path,
        name: entry.name,
        isDirectory: entry.isDirectory,
      },
    });
    useToastStore.getState().push(`Copied “${entry.name}” to clipboard`, 'info');
  },

  paste: async () => {
    const { clipboard, currentPath } = get();
    if (!clipboard || !currentPath) return;
    set({ loading: true, error: null });
    try {
      await postFiles({
        action: 'copy',
        from: clipboard.path,
        toDir: currentPath,
      });
      await get().openPath(currentPath);
      set({ loading: false });
      notifyFileIoComplete();
      useToastStore.getState().push(`Pasted “${clipboard.name}”`, 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Paste failed';
      set({ loading: false, error: msg });
      useToastStore.getState().push(msg, 'error');
    }
  },

  transferTo: async (destDir) => {
    const { selected } = get();
    if (!selected) return;
    set({ loading: true, error: null });
    try {
      const data = await postFiles({
        action: 'copy',
        from: selected.path,
        toDir: destDir,
      });
      set({ loading: false });
      useToastStore.getState().push(`Copied to ${data.dest}`, 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transfer failed';
      set({ loading: false, error: msg });
      useToastStore.getState().push(msg, 'error');
    }
  },

  mkdir: async (name) => {
    const { currentPath } = get();
    if (!currentPath) return;
    set({ loading: true, error: null });
    try {
      await postFiles({ action: 'mkdir', path: currentPath, name });
      await get().openPath(currentPath);
      set({ loading: false });
      notifyFileIoComplete();
      useToastStore.getState().push(`Created folder “${name}”`, 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Cannot create folder';
      set({ loading: false, error: msg });
      useToastStore.getState().push(msg, 'error');
    }
  },

  removeSelected: async () => {
    const { selected, currentPath } = get();
    if (!selected || !currentPath) return;
    set({ loading: true, error: null });
    try {
      await postFiles({ action: 'delete', path: selected.path });
      await get().openPath(currentPath);
      set({ loading: false, selected: null, preview: null });
      useToastStore.getState().push(`Deleted “${selected.name}”`, 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Delete failed';
      set({ loading: false, error: msg });
      useToastStore.getState().push(msg, 'error');
    }
  },

  renameSelected: async (newName) => {
    const { selected, currentPath } = get();
    if (!selected || !currentPath || !newName.trim()) return;
    set({ loading: true, error: null });
    try {
      await postFiles({
        action: 'rename',
        path: selected.path,
        newName: newName.trim(),
      });
      await get().openPath(currentPath);
      set({ loading: false });
      useToastStore.getState().push(`Renamed to “${newName.trim()}”`, 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Rename failed';
      set({ loading: false, error: msg });
      useToastStore.getState().push(msg, 'error');
    }
  },

  moveEntry: async (from, toDir) => {
    const { currentPath } = get();
    set({ loading: true, error: null });
    try {
      const data = await postFiles({ action: 'move', from, toDir });
      if (currentPath) await get().openPath(currentPath);
      set({ loading: false });
      if (!data.skipped) {
        notifyFileIoComplete();
        const name = from.split(/[/\\]/).pop() ?? 'item';
        useToastStore.getState().push(`Moved “${name}”`, 'success');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Move failed';
      set({ loading: false, error: msg });
      useToastStore.getState().push(msg, 'error');
    }
  },

  uploadFiles: async (files, destDir) => {
    if (!files.length) return;
    set({ loading: true, error: null });
    let ok = 0;
    try {
      for (const file of files) {
        const form = new FormData();
        form.append('destDir', destDir);
        form.append('file', file);
        const res = await fetch('/api/files/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to upload ${file.name}`);
        ok++;
      }
      await get().openPath(destDir);
      notifyFileIoComplete();
      set({ loading: false });
      useToastStore
        .getState()
        .push(
          ok === 1 ? `Uploaded “${files[0].name}”` : `Uploaded ${ok} files`,
          'success'
        );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      set({ loading: false, error: msg });
      useToastStore.getState().push(msg, 'error');
      if (ok > 0 && destDir) await get().openPath(destDir);
    }
  },

  loadPreview: async (entry) => {
    if (entry.isDirectory) {
      set({ preview: null });
      return;
    }
    try {
      const data = await postFiles({ action: 'read', path: entry.path });
      set({ preview: data.content });
    } catch (e) {
      set({
        preview: `[Cannot preview: ${e instanceof Error ? e.message : 'unknown'}]`,
      });
    }
  },
}));
