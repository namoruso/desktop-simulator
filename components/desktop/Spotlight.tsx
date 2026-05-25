'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Search,
  Globe,
  FolderOpen,
  Terminal,
  Settings,
  Activity,
  FileText,
  Calculator,
  Image,
  FileType,
} from 'lucide-react';
import { launchApp } from '@/lib/launchApp';
import { APP_LABELS, SPOTLIGHT_APPS } from '@/lib/appIcons';
import type { AppType } from '@/types/window.types';
import { normalizeBrowserInput } from '@/lib/browserUrl';

const APP_ICONS_MAP: Record<AppType, React.ReactNode> = {
  'file-manager': <FolderOpen size={18} />,
  'task-manager': <Activity size={18} />,
  terminal: <Terminal size={18} />,
  'text-editor': <FileText size={18} />,
  calculator: <Calculator size={18} />,
  browser: <Globe size={18} />,
  'image-viewer': <Image size={18} />,
  'pdf-viewer': <FileType size={18} />,
  settings: <Settings size={18} />,
};

interface SpotlightProps {
  open: boolean;
  onClose: () => void;
}

export function Spotlight({ open, onClose }: SpotlightProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.toLowerCase().trim();
  const apps = SPOTLIGHT_APPS.filter((a) =>
    APP_LABELS[a].toLowerCase().includes(q)
  );

  const runSearch = () => {
    launchApp('browser');
    const { url } = normalizeBrowserInput(query);
    onClose();
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('webos-browser-navigate', { detail: { url } })
      );
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center bg-black/50 pt-[16vh] backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="os-glass-popover w-full max-w-xl overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--separator)] px-4 py-3.5">
          <Search size={20} className="text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                if (apps.length && !q.includes('.')) {
                  launchApp(apps[0]);
                  onClose();
                } else {
                  runSearch();
                }
              }
            }}
            placeholder="Search apps, files, or the web…"
            className="os-focus-ring flex-1 rounded-lg bg-transparent text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)]"
          />
          <kbd className="rounded-md border border-[var(--separator)] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
            Esc
          </kbd>
        </div>

        <ul className="max-h-72 overflow-auto py-2">
          {apps.map((app) => (
            <li key={app}>
              <button
                type="button"
                className="os-menu-item mx-2"
                onClick={() => {
                  launchApp(app);
                  onClose();
                }}
              >
                <span className="text-[var(--accent)]">{APP_ICONS_MAP[app]}</span>
                <span>{APP_LABELS[app]}</span>
              </button>
            </li>
          ))}
          {query.trim() && (
            <li>
              <button type="button" className="os-menu-item mx-2" onClick={runSearch}>
                <Globe size={18} className="text-[var(--accent)]" />
                <span>Search web for &quot;{query}&quot;</span>
              </button>
            </li>
          )}
          {!apps.length && !query.trim() && (
            <li className="px-4 py-6 text-center text-[12px] text-[var(--text-muted)]">
              Type to open an app or search the internet
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
