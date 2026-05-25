'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Globe, FolderOpen, Terminal, Settings, Activity, FileText, Calculator, Image, FileType } from 'lucide-react';
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
        else {
          /* parent toggles */
        }
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
      className="fixed inset-0 z-[300] flex items-start justify-center bg-black/50 pt-[18vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[rgba(20,24,36,0.97)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search size={20} className="text-slate-400" />
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
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">
            Esc
          </kbd>
        </div>

        <ul className="max-h-72 overflow-auto py-2">
          {apps.map((app) => (
            <li key={app}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/5"
                onClick={() => {
                  launchApp(app);
                  onClose();
                }}
              >
                <span className="text-indigo-400">{APP_ICONS_MAP[app]}</span>
                <span className="text-slate-200">{APP_LABELS[app]}</span>
              </button>
            </li>
          ))}
          {query.trim() && (
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/5"
                onClick={runSearch}
              >
                <Globe size={18} className="text-sky-400" />
                <span className="text-slate-200">
                  Search web for &quot;{query}&quot;
                </span>
              </button>
            </li>
          )}
          {!apps.length && !query.trim() && (
            <li className="px-4 py-6 text-center text-xs text-slate-500">
              Type to open an app or search the internet
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
