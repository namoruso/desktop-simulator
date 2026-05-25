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
    <footer className="pointer-events-none absolute bottom-4 left-0 right-0 z-50 flex flex-col items-center gap-2.5">
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
                  'os-interactive os-focus-ring pointer-events-auto max-w-[160px] truncate rounded-full px-3 py-1 text-[10px] font-semibold',
                  w.isFocused
                    ? 'bg-[var(--accent)]/30 text-white ring-1 ring-[var(--accent)]/40'
                    : 'border border-[var(--separator)] bg-black/40 text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)]'
                )}
              >
                {w.title}
              </button>
            ))}
        </div>
      )}

      <div
        className={clsx(
          'dock-glass pointer-events-auto flex items-end gap-1 rounded-2xl px-2.5 py-2.5',
          hasOpen && 'ring-1 ring-white/20'
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
                'os-interactive os-focus-ring group relative flex flex-col items-center rounded-xl px-1.5 pb-1 pt-0.5 transition-all duration-200 ease-out',
                isFocused && '-translate-y-3.5 scale-105',
                isOpen && !isFocused && '-translate-y-1.5'
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
                    isFocused ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-white'
                  )}
                />
                {instances.length > 1 && (
                  <span className="mac-badge absolute -right-0.5 -top-0.5 h-4 min-w-[16px] text-[9px]">
                    {instances.length}
                  </span>
                )}
              </div>

              {showLabels && (
                <span className="mt-0.5 max-w-[72px] truncate text-[9px] text-[var(--text-muted)]">
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
