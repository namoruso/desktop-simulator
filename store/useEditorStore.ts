import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useToastStore } from '@/store/useToastStore';

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

interface EditorStore {
  filePath: string | null;
  content: string;
  savedContent: string;
  loading: boolean;
  recentFiles: string[];
  isDirty: () => boolean;
  setContent: (content: string) => void;
  openFile: (path: string) => Promise<void>;
  saveFile: () => Promise<void>;
  saveToPath: (path: string) => Promise<void>;
  newFile: () => void;
  addRecent: (path: string) => void;
  clearRecentFiles: () => void;
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      filePath: null,
      content: '',
      savedContent: '',
      loading: false,
      recentFiles: [],

      isDirty: () => get().content !== get().savedContent,

      setContent: (content) => set({ content }),

      addRecent: (path) =>
        set((s) => ({
          recentFiles: [path, ...s.recentFiles.filter((p) => p !== path)].slice(
            0,
            8
          ),
        })),

      openFile: async (path) => {
        set({ loading: true });
        try {
          const data = await postFiles({ action: 'read', path });
          set({
            filePath: path,
            content: data.content,
            savedContent: data.content,
            loading: false,
          });
          get().addRecent(path);
        } catch (e) {
          set({ loading: false });
          useToastStore
            .getState()
            .push(e instanceof Error ? e.message : 'Cannot open file', 'error');
        }
      },

      saveFile: async () => {
        const { filePath, content } = get();
        if (!filePath) {
          useToastStore.getState().push('Use Save As for new files', 'warning');
          return;
        }
        await get().saveToPath(filePath);
      },

      saveToPath: async (path) => {
        const { content } = get();
        set({ loading: true });
        try {
          await postFiles({ action: 'write', path, content });
          set({ filePath: path, savedContent: content, loading: false });
          get().addRecent(path);
          useToastStore.getState().push('File saved', 'success');
        } catch (e) {
          set({ loading: false });
          useToastStore
            .getState()
            .push(e instanceof Error ? e.message : 'Save failed', 'error');
        }
      },

      newFile: () =>
        set({
          filePath: null,
          content: '',
          savedContent: '',
        }),

      clearRecentFiles: () => set({ recentFiles: [] }),
    }),
    {
      name: 'webos-editor-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ recentFiles: s.recentFiles }),
      skipHydration: true,
    }
  )
);
