import { launchApp } from '@/lib/launchApp';
import { useWindowStore } from '@/store/useWindowStore';
import { useImageViewerStore } from '@/store/useImageViewerStore';
import { usePdfViewerStore } from '@/store/usePdfViewerStore';

export const IMAGE_OPEN_EVENT = 'webos-image-open';
export const PDF_OPEN_EVENT = 'webos-pdf-open';

function setViewerTitle(appType: 'image-viewer' | 'pdf-viewer', filePath: string) {
  const base = filePath.split(/[/\\]/).pop() ?? 'file';
  const win = useWindowStore.getState().windows.find((w) => w.appType === appType);
  if (win) {
    useWindowStore.getState().setWindowTitle(win.id, base);
  }
}

export function openFileInImageViewer(filePath: string) {
  useImageViewerStore.getState().setFilePath(filePath);
  launchApp('image-viewer');
  setViewerTitle('image-viewer', filePath);
  requestAnimationFrame(() => {
    window.dispatchEvent(
      new CustomEvent(IMAGE_OPEN_EVENT, { detail: { path: filePath } })
    );
  });
}

export function openFileInPdfViewer(filePath: string) {
  usePdfViewerStore.getState().setFilePath(filePath);
  launchApp('pdf-viewer');
  setViewerTitle('pdf-viewer', filePath);
  requestAnimationFrame(() => {
    window.dispatchEvent(
      new CustomEvent(PDF_OPEN_EVENT, { detail: { path: filePath } })
    );
  });
}
