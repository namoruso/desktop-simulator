import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '@/lib/uuid';
import type { AppType, WindowInstance } from '@/types/window.types';

const APP_TITLES: Record<AppType, string> = {
  'task-manager': 'Task Manager',
  terminal: 'Terminal',
  'text-editor': 'Text Editor',
  calculator: 'Calculator',
  browser: 'Browser',
  'file-manager': 'File Manager',
  'image-viewer': 'Image Viewer',
  'pdf-viewer': 'PDF Viewer',
  settings: 'Settings',
};

const DEFAULT_SIZES: Record<AppType, { width: number; height: number }> = {
  'task-manager': { width: 900, height: 600 },
  terminal: { width: 700, height: 420 },
  'text-editor': { width: 740, height: 520 },
  calculator: { width: 340, height: 500 },
  browser: { width: 920, height: 640 },
  'file-manager': { width: 820, height: 560 },
  'image-viewer': { width: 760, height: 580 },
  'pdf-viewer': { width: 900, height: 640 },
  settings: { width: 560, height: 480 },
};

let windowOffset = 0;

function nextPosition() {
  windowOffset = (windowOffset + 28) % 200;
  return {
    x: 80 + windowOffset,
    y: 48 + windowOffset,
  };
}

interface WindowStore {
  windows: WindowInstance[];
  maxZIndex: number;
  openWindow: (appType: AppType, pid?: number) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updatePosition: (id: string, pos: { x: number; y: number }) => void;
  updateSize: (id: string, size: { width: number; height: number }) => void;
  setWindowTitle: (id: string, title: string) => void;
}

export const useWindowStore = create<WindowStore>()(
  persist(
    (set, get) => ({
      windows: [],
      maxZIndex: 100,

      openWindow: (appType, pid = Date.now() % 100000) => {
        const id = generateId();
        const z = get().maxZIndex + 1;
        const newWindow: WindowInstance = {
          id,
          appType,
          title: APP_TITLES[appType],
          isMinimized: false,
          isMaximized: false,
          isFocused: true,
          zIndex: z,
          position: nextPosition(),
          size: DEFAULT_SIZES[appType],
          pid,
        };
        set((s) => ({
          windows: [
            ...s.windows.map((w) => ({ ...w, isFocused: false })),
            newWindow,
          ],
          maxZIndex: z,
        }));
        return id;
      },

      closeWindow: (id) =>
        set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

      minimizeWindow: (id) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, isMinimized: true, isFocused: false } : w
          ),
        })),

      restoreWindow: (id) => {
        const z = get().maxZIndex + 1;
        set((s) => ({
          windows: s.windows.map((w) => ({
            ...w,
            isMinimized: w.id === id ? false : w.isMinimized,
            isFocused: w.id === id,
            zIndex: w.id === id ? z : w.zIndex,
          })),
          maxZIndex: z,
        }));
      },

      maximizeWindow: (id) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
          ),
        })),

      focusWindow: (id) => {
        const win = get().windows.find((w) => w.id === id);
        if (win?.isMinimized) {
          get().restoreWindow(id);
          return;
        }
        const z = get().maxZIndex + 1;
        set((s) => ({
          windows: s.windows.map((w) => ({
            ...w,
            isFocused: w.id === id,
            zIndex: w.id === id ? z : w.zIndex,
          })),
          maxZIndex: z,
        }));
      },

      updatePosition: (id, pos) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, position: pos } : w
          ),
        })),

      updateSize: (id, size) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, size } : w
          ),
        })),

      setWindowTitle: (id, title) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, title } : w
          ),
        })),
    }),
    {
      name: 'webos-windows-v2',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ windows: s.windows, maxZIndex: s.maxZIndex }),
    }
  )
);
