'use client';

import { useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, ExternalLink } from 'lucide-react';
import { AppShell, AppToolbar, ToolbarButton } from '@/components/ui/AppShell';
import { useImageViewerStore } from '@/store/useImageViewerStore';
import { IMAGE_OPEN_EVENT } from '@/lib/mediaBridge';
import { getRawFileUrl } from '@/lib/fileTypes';
import { useWindowStore } from '@/store/useWindowStore';

export function ImageViewer() {
  const filePath = useImageViewerStore((s) => s.filePath);
  const setFilePath = useImageViewerStore((s) => s.setFilePath);
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const path = (e as CustomEvent<{ path: string }>).detail?.path;
      if (path) {
        setFilePath(path);
        setZoom(100);
        setError(false);
        const base = path.split(/[/\\]/).pop() ?? 'Image';
        const win = useWindowStore
          .getState()
          .windows.find((w) => w.appType === 'image-viewer');
        if (win) useWindowStore.getState().setWindowTitle(win.id, base);
      }
    };
    window.addEventListener(IMAGE_OPEN_EVENT, handler);
    return () => window.removeEventListener(IMAGE_OPEN_EVENT, handler);
  }, [setFilePath]);

  const src = filePath ? getRawFileUrl(filePath) : null;

  return (
    <AppShell>
      <AppToolbar>
        <ToolbarButton
          title="Zoom out"
          disabled={zoom <= 25}
          onClick={() => setZoom((z) => Math.max(25, z - 25))}
        >
          <ZoomOut size={16} />
        </ToolbarButton>
        <span className="min-w-[3rem] text-center text-[10px] text-[var(--text-muted)]">
          {zoom}%
        </span>
        <ToolbarButton
          title="Zoom in"
          disabled={zoom >= 300}
          onClick={() => setZoom((z) => Math.min(300, z + 25))}
        >
          <ZoomIn size={16} />
        </ToolbarButton>
        <ToolbarButton title="Reset zoom" onClick={() => setZoom(100)}>
          <RotateCcw size={16} />
        </ToolbarButton>
        {filePath && (
          <ToolbarButton
            title="Open in new tab"
            onClick={() => window.open(getRawFileUrl(filePath), '_blank')}
          >
            <ExternalLink size={16} />
          </ToolbarButton>
        )}
        <span className="ml-auto truncate font-mono text-[10px] text-[var(--text-muted)]">
          {filePath ?? 'Open an image from File Manager'}
        </span>
      </AppToolbar>

      <div className="mac-canvas flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
        {!filePath ? (
          <p className="text-sm text-[var(--text-muted)]">
            Double-click an image in File Manager to open it here.
          </p>
        ) : error ? (
          <p className="text-sm text-red-400">Failed to load image.</p>
        ) : (
          src && (
            <img
              src={src}
              alt={filePath.split(/[/\\]/).pop() ?? 'image'}
              onError={() => setError(true)}
              onLoad={() => setError(false)}
              style={{ width: `${zoom}%`, maxWidth: 'none' }}
              className="h-auto max-h-full object-contain shadow-lg"
              draggable={false}
            />
          )
        )}
      </div>
    </AppShell>
  );
}
