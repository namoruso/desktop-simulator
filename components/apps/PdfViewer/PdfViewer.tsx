'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { AppShell, AppToolbar, ToolbarButton } from '@/components/ui/AppShell';
import { usePdfViewerStore } from '@/store/usePdfViewerStore';
import { PDF_OPEN_EVENT } from '@/lib/mediaBridge';
import { getRawFileUrl } from '@/lib/fileTypes';
import { useWindowStore } from '@/store/useWindowStore';

export function PdfViewer() {
  const filePath = usePdfViewerStore((s) => s.filePath);
  const setFilePath = usePdfViewerStore((s) => s.setFilePath);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const path = (e as CustomEvent<{ path: string }>).detail?.path;
      if (path) {
        setFilePath(path);
        setReloadKey((k) => k + 1);
        const base = path.split(/[/\\]/).pop() ?? 'PDF';
        const win = useWindowStore
          .getState()
          .windows.find((w) => w.appType === 'pdf-viewer');
        if (win) useWindowStore.getState().setWindowTitle(win.id, base);
      }
    };
    window.addEventListener(PDF_OPEN_EVENT, handler);
    return () => window.removeEventListener(PDF_OPEN_EVENT, handler);
  }, [setFilePath]);

  const src = filePath ? `${getRawFileUrl(filePath)}#${reloadKey}` : null;

  return (
    <AppShell>
      <AppToolbar>
        <ToolbarButton
          title="Reload"
          disabled={!filePath}
          onClick={() => setReloadKey((k) => k + 1)}
        >
          <RefreshCw size={16} />
        </ToolbarButton>
        {filePath && (
          <ToolbarButton
            title="Open in browser tab"
            onClick={() => window.open(getRawFileUrl(filePath), '_blank')}
          >
            <ExternalLink size={16} />
          </ToolbarButton>
        )}
        <span className="ml-auto truncate font-mono text-[10px] text-[var(--text-muted)]">
          {filePath ?? 'Open a PDF from File Manager'}
        </span>
      </AppToolbar>

      <div className="mac-canvas relative min-h-0 flex-1">
        {!filePath ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[var(--text-muted)]">
            Double-click a PDF in File Manager to open it here.
          </div>
        ) : (
          src && (
            <iframe
              key={reloadKey}
              title={filePath.split(/[/\\]/).pop() ?? 'PDF'}
              src={src}
              className="h-full w-full border-0 bg-white"
            />
          )
        )}
      </div>
    </AppShell>
  );
}
