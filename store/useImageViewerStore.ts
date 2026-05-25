import { create } from 'zustand';

interface ImageViewerStore {
  filePath: string | null;
  setFilePath: (path: string | null) => void;
}

export const useImageViewerStore = create<ImageViewerStore>((set) => ({
  filePath: null,
  setFilePath: (filePath) => set({ filePath }),
}));
