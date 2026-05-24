import { create } from 'zustand';
import type { FSNode, IOLogEntry } from '@/types/filesystem.types';
import {
  loadFilesystem,
  loadIOLogs,
  writeFile,
  deleteNode,
  resetFilesystem,
  appendIOLog,
} from '@/lib/filesystem';

interface FileStore {
  nodes: FSNode[];
  ioLogs: IOLogEntry[];
  currentPath: string;
  selectedPath: string | null;
  loaded: boolean;
  init: () => Promise<void>;
  navigate: (path: string) => void;
  select: (path: string | null) => void;
  refresh: () => Promise<void>;
  createFile: (name: string, content: string) => Promise<void>;
  remove: (path: string) => Promise<void>;
  logIO: (entry: Omit<IOLogEntry, 'id' | 'timestamp'>) => Promise<void>;
  reset: () => Promise<void>;
}

export const useFileStore = create<FileStore>((set, get) => ({
  nodes: [],
  ioLogs: [],
  currentPath: '/home/user',
  selectedPath: null,
  loaded: false,

  init: async () => {
    const [nodes, ioLogs] = await Promise.all([loadFilesystem(), loadIOLogs()]);
    set({ nodes, ioLogs, loaded: true });
  },

  navigate: (path) => set({ currentPath: path, selectedPath: null }),

  select: (path) => set({ selectedPath: path }),

  refresh: async () => {
    const [nodes, ioLogs] = await Promise.all([loadFilesystem(), loadIOLogs()]);
    set({ nodes, ioLogs });
  },

  createFile: async (name, content) => {
    const { currentPath, nodes } = get();
    const next = await writeFile(nodes, currentPath, name, content);
    set({ nodes: next });
    await get().refresh();
  },

  remove: async (path) => {
    const next = await deleteNode(get().nodes, path);
    set({ nodes: next, selectedPath: null });
    await get().refresh();
  },

  logIO: async (entry) => {
    await appendIOLog(entry);
    const ioLogs = await loadIOLogs();
    set({ ioLogs });
  },

  reset: async () => {
    const nodes = await resetFilesystem();
    set({ nodes, ioLogs: [], currentPath: '/home/user', selectedPath: null });
  },
}));

