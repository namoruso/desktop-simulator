import path from 'path';
import { launchApp } from '@/lib/launchApp';
import { useWindowStore } from '@/store/useWindowStore';

export const EDITOR_OPEN_EVENT = 'webos-editor-open';

const TEXT_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.json',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.html',
  '.xml',
  '.yml',
  '.yaml',
  '.env',
  '.sh',
  '.py',
  '.rs',
  '.go',
  '.toml',
  '.ini',
  '.cfg',
  '.log',
  '.csv',
]);

export function isEditableTextFile(name: string, size = 0): boolean {
  if (size > 2 * 1024 * 1024) return false;
  const ext = path.extname(name).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  if (!ext && size < 512 * 1024) return true;
  return false;
}

export function openFileInEditor(filePath: string) {
  launchApp('text-editor');
  const base = filePath.split(/[/\\]/).pop() ?? 'file';
  const win = useWindowStore
    .getState()
    .windows.find((w) => w.appType === 'text-editor');
  if (win) {
    useWindowStore.getState().setWindowTitle(win.id, base);
  }
  requestAnimationFrame(() => {
    window.dispatchEvent(
      new CustomEvent(EDITOR_OPEN_EVENT, { detail: { path: filePath } })
    );
  });
}
