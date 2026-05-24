'use client';

import clsx from 'clsx';
import type { AppType } from '@/types/window.types';
import { useWindowStore } from '@/store/useWindowStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { AppIcon, APP_LABELS, DOCK_APPS } from '@/lib/appIcons';
import { launchApp } from '@/lib/launchApp';

export function Dock() {
  const windows = useWindowStore((s) => s.windows);
  const showLabels = useSettingsStore((s) => s.showDockLabels);
  const openTypes = new Set(
    windows.filter((w) => !w.isMinimized).map((w) => w.appType)
  );
  const hasOpen = openTypes.size > 0;

  return (
    <footer className="pointer-events-none absolute bottom-3 left-0 right-0 z-50 flex flex-col items-center gap-2">
      {hasOpen && (
        <div className="pointer-events-none flex max-w-[90vw] flex-wrap justify-center gap-1.5 px-2">
          {windows
            .filter((w) => !w.isMinimized)
            .map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => useWindowStore.getState().focusWindow(w.id)}
                className={clsx(
                  'pointer-events-auto max-w-[140px] truncate rounded-full px-3 py-1 text-[10px] font-medium transition',
                  w.isFocused
                    ? 'bg-white/20 text-white ring-1 ring-white/30'
                    : 'bg-black/40 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                )}
              >
                {w.title}
              </button>
            ))}
        </div>
      )}

      <div
        className={clsx(
          'dock-glass pointer-events-auto flex items-end gap-0.5 rounded-2xl px-2 py-2',
          hasOpen && 'ring-1 ring-white/15'
        )}
      >
        {DOCK_APPS.map((appType) => {
          const instances = windows.filter((w) => w.appType === appType);
          const visible = instances.filter((w) => !w.isMinimized);
          const isOpen = visible.length > 0;
          const isMinimized = instances.some((w) => w.isMinimized);
          const focused = visible.find((w) => w.isFocused);
          const isFocused = !!focused;

          return (
            <button
              key={appType}
              type="button"
              title={`${APP_LABELS[appType]}${instances.length > 1 ? ` (${instances.length})` : ''} — right-click: new window`}
              onClick={() => launchApp(appType)}
              onContextMenu={(e) => {
                e.preventDefault();
                launchApp(appType, true);
              }}
              className={clsx(
                'group relative flex flex-col items-center px-1.5 pb-1 pt-0.5 transition-all duration-200',
                isFocused && '-translate-y-3',
                isOpen && !isFocused && '-translate-y-1'
              )}
            >
              <div
                className={clsx(
                  'relative flex items-center justify-center rounded-xl transition-all',
                  isFocused
                    ? 'h-14 w-14 bg-white/25 shadow-lg shadow-black/40 ring-2 ring-white/30'
                    : isOpen
                      ? 'h-12 w-12 bg-white/12 ring-1 ring-white/15'
                      : 'h-11 w-11 group-hover:h-12 group-hover:w-12 group-hover:bg-white/10'
                )}
              >
                <AppIcon
                  appType={appType}
                  size={isFocused ? 28 : 24}
                  className={clsx(
                    isFocused ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  )}
                />
                {instances.length > 1 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-bold text-white">
                    {instances.length}
                  </span>
                )}
              </div>

              {showLabels && (
                <span className="mt-0.5 max-w-[72px] truncate text-[9px] text-slate-400">
                  {APP_LABELS[appType]}
                </span>
              )}
              <div className="mt-1 flex h-1 items-center justify-center gap-0.5">
                {isOpen && (
                  <span
                    className={clsx(
                      'rounded-full transition-all',
                      isFocused ? 'h-1 w-5 bg-white' : 'h-1 w-1 bg-white/70',
                      isMinimized && !isFocused && 'bg-amber-400'
                    )}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
