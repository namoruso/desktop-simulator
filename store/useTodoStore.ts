import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '@/lib/uuid';
import type { TodoFolder, TodoTask } from '@/types/todo.types';

function nowIso() {
  return new Date().toISOString();
}

function createInboxFolder(): TodoFolder {
  return {
    id: generateId(),
    name: 'Inbox',
    createdAt: nowIso(),
    order: 0,
  };
}

interface TodoStore {
  folders: TodoFolder[];
  tasks: TodoTask[];
  activeFolderId: string | null;
  showCompleted: boolean;

  createFolder: (name: string) => string;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => boolean;
  setActiveFolder: (id: string) => void;
  reorderFolder: (id: string, direction: 'up' | 'down') => void;

  createTask: (folderId: string, title: string) => string;
  updateTask: (
    id: string,
    updates: Partial<Pick<TodoTask, 'title' | 'completed' | 'folderId'>>
  ) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, folderId: string) => void;

  setShowCompleted: (show: boolean) => void;
  taskCount: (folderId: string) => number;
  ensureDefaults: () => void;
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      folders: [],
      tasks: [],
      activeFolderId: null,
      showCompleted: true,

      ensureDefaults: () => {
        const { folders, activeFolderId } = get();
        if (folders.length === 0) {
          const inbox = createInboxFolder();
          set({ folders: [inbox], activeFolderId: inbox.id });
          return;
        }
        if (!activeFolderId || !folders.some((f) => f.id === activeFolderId)) {
          set({ activeFolderId: folders[0]?.id ?? null });
        }
      },

      createFolder: (name) => {
        const id = generateId();
        const order = get().folders.length;
        const folder: TodoFolder = {
          id,
          name: name.trim(),
          createdAt: nowIso(),
          order,
        };
        set((s) => ({
          folders: [...s.folders, folder],
          activeFolderId: id,
        }));
        return id;
      },

      updateFolder: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => ({
          folders: s.folders.map((f) =>
            f.id === id ? { ...f, name: trimmed } : f
          ),
        }));
      },

      deleteFolder: (id) => {
        const { folders, tasks, activeFolderId } = get();
        if (folders.length <= 1) return false;

        const nextFolders = folders.filter((f) => f.id !== id);
        const fallback = nextFolders[0]?.id ?? null;
        set({
          folders: nextFolders.map((f, i) => ({ ...f, order: i })),
          tasks: tasks.filter((t) => t.folderId !== id),
          activeFolderId: activeFolderId === id ? fallback : activeFolderId,
        });
        return true;
      },

      setActiveFolder: (id) => {
        if (get().folders.some((f) => f.id === id)) {
          set({ activeFolderId: id });
        }
      },

      reorderFolder: (id, direction) => {
        const folders = [...get().folders].sort((a, b) => a.order - b.order);
        const idx = folders.findIndex((f) => f.id === id);
        if (idx < 0) return;
        const swap = direction === 'up' ? idx - 1 : idx + 1;
        if (swap < 0 || swap >= folders.length) return;
        [folders[idx], folders[swap]] = [folders[swap], folders[idx]];
        set({
          folders: folders.map((f, i) => ({ ...f, order: i })),
        });
      },

      createTask: (folderId, title) => {
        const trimmed = title.trim();
        if (!trimmed) return '';
        const id = generateId();
        const ts = nowIso();
        const task: TodoTask = {
          id,
          folderId,
          title: trimmed,
          completed: false,
          createdAt: ts,
          updatedAt: ts,
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        return id;
      },

      updateTask: (id, updates) => {
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const next = { ...t, ...updates, updatedAt: nowIso() };
            if ('title' in updates && typeof updates.title === 'string') {
              next.title = updates.title.trim();
            }
            return next;
          }),
        }));
      },

      toggleTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, completed: !t.completed, updatedAt: nowIso() }
              : t
          ),
        }));
      },

      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      },

      moveTask: (taskId, folderId) => {
        if (!get().folders.some((f) => f.id === folderId)) return;
        get().updateTask(taskId, { folderId });
      },

      setShowCompleted: (show) => set({ showCompleted: show }),

      taskCount: (folderId) =>
        get().tasks.filter((t) => t.folderId === folderId && !t.completed)
          .length,
    }),
    {
      name: 'webos-todo-v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        folders: s.folders,
        tasks: s.tasks,
        activeFolderId: s.activeFolderId,
        showCompleted: s.showCompleted,
      }),
      onRehydrateStorage: () => (state) => {
        state?.ensureDefaults();
      },
    }
  )
);
