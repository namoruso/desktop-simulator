'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  FilePlus,
  Save,
  FolderOpen,
  Loader2,
  Circle,
} from 'lucide-react';
import { AppShell, AppToolbar, ToolbarButton } from '@/components/ui/AppShell';
import { Btn } from '@/components/ui/os-ui';
import { PromptDialog, RecentFilesDialog } from '@/components/ui/OSDialog';
import { useEditorStore } from '@/store/useEditorStore';
import { EDITOR_OPEN_EVENT } from '@/lib/editorBridge';
import { useWindowStore } from '@/store/useWindowStore';

export function TextEditor() {
  const filePath = useEditorStore((s) => s.filePath);
  const content = useEditorStore((s) => s.content);
  const loading = useEditorStore((s) => s.loading);
  const recentFiles = useEditorStore((s) => s.recentFiles);
  const setContent = useEditorStore((s) => s.setContent);
  const openFile = useEditorStore((s) => s.openFile);
  const saveFile = useEditorStore((s) => s.saveFile);
  const saveToPath = useEditorStore((s) => s.saveToPath);
  const newFile = useEditorStore((s) => s.newFile);
  const clearRecentFiles = useEditorStore((s) => s.clearRecentFiles);
  const isDirty = useEditorStore((s) => s.isDirty);

  const dirty = isDirty();
  const fileName = filePath?.split(/[/\\]/).pop() ?? 'Untitled';
  const lines = content.split('\n').length;
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);

  const syncTitle = useCallback(
    (path: string | null) => {
      const win = useWindowStore
        .getState()
        .windows.find((w) => w.appType === 'text-editor' && !w.isMinimized);
      if (!win) return;
      const label = path?.split(/[/\\]/).pop() ?? 'Untitled';
      useWindowStore.getState().setWindowTitle(
        win.id,
        dirty ? `${label} •` : label
      );
    },
    [dirty]
  );

  useEffect(() => {
    syncTitle(filePath);
  }, [filePath, dirty, syncTitle]);

  useEffect(() => {
    const handler = (e: Event) => {
      const path = (e as CustomEvent<{ path: string }>).detail?.path;
      if (path) void openFile(path);
    };
    window.addEventListener(EDITOR_OPEN_EVENT, handler);
    return () => window.removeEventListener(EDITOR_OPEN_EVENT, handler);
  }, [openFile]);

  const handleSaveAs = () => setSaveAsOpen(true);

  const handleOpenRecent = () => setRecentOpen(true);

  return (
    <AppShell>
      <AppToolbar>
        <ToolbarButton title="New file" onClick={newFile}>
          <FilePlus size={16} />
        </ToolbarButton>
        <ToolbarButton title="Open recent" onClick={handleOpenRecent}>
          <FolderOpen size={16} />
        </ToolbarButton>
        <ToolbarButton title="Save" onClick={() => void saveFile()}>
          <Save size={16} />
        </ToolbarButton>
        <Btn variant="default" onClick={handleSaveAs}>
          Save As…
        </Btn>
        {loading && (
          <Loader2 size={14} className="ml-1 animate-spin text-[var(--text-muted)]" />
        )}
        <div className="ml-auto flex items-center gap-2 truncate text-[10px] text-[var(--text-muted)]">
          {dirty && (
            <span className="flex items-center gap-1 text-amber-400">
              <Circle size={6} fill="currentColor" /> Unsaved
            </span>
          )}
          <span className="hidden font-mono sm:inline">{filePath ?? 'New file'}</span>
          <span>{lines} lines</span>
        </div>
      </AppToolbar>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            void saveFile();
          }
        }}
        placeholder="Start typing… Open text files from File Manager (double-click or Open in Editor)."
        className="min-h-0 flex-1 resize-none bg-[rgba(8,10,18,0.6)] p-4 font-mono text-sm leading-relaxed text-[var(--text-primary)] outline-none selection:bg-[var(--accent)]/30"
        spellCheck={false}
      />

      <footer className="border-t border-[var(--separator)] px-3 py-1.5 text-[10px] text-[var(--text-muted)]">
        {fileName} · Ctrl+S to save · Host filesystem (home, /media, /mnt)
      </footer>

      <RecentFilesDialog
        open={recentOpen}
        files={recentFiles}
        onCancel={() => setRecentOpen(false)}
        onClear={() => clearRecentFiles()}
        onSelect={(path) => {
          setRecentOpen(false);
          void openFile(path);
        }}
      />

      <PromptDialog
        open={saveAsOpen}
        title="Save As"
        label="Full path"
        defaultValue={filePath ?? ''}
        placeholder="/home/nick/Documents/notes.txt"
        submitLabel="Save"
        onCancel={() => setSaveAsOpen(false)}
        onSubmit={(path) => {
          setSaveAsOpen(false);
          void saveToPath(path);
        }}
      />
    </AppShell>
  );
}
