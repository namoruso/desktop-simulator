import { create } from 'zustand';

interface PdfViewerStore {
  filePath: string | null;
  setFilePath: (path: string | null) => void;
}

export const usePdfViewerStore = create<PdfViewerStore>((set) => ({
  filePath: null,
  setFilePath: (filePath) => set({ filePath }),
}));
