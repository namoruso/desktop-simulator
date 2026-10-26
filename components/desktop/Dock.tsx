'use client';

import clsx from 'clsx';
import { useWindowStore } from '@/store/useWindowStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { AppIcon, APP_LABELS, DOCK_APPS } from '@/lib/appIcons';
import { launchApp } from '@/lib/launchApp';

export function Dock() {
  const windows = useWindowStore((s) => s.windows);
  const showLabels = useSettingsStore((s) => s.showDockLabels);

  return (
    <footer className="pointer-events-none absolute bottom-4 left-0 right-0 z-50 flex justify-center">
      <div className="dock-glass pointer-events-auto flex items-end gap-1 rounded-2xl px-2.5 py-2">
        {DOCK_APPS.map((appType) => {
          const instances = windows.filter((w) => w.appType === appType);
          const visible = instances.filter((w) => !w.isMinimized);
          const isOpen = visible.length > 0;
          const isMinimized = instances.some((w) => w.isMinimized);
          const isFocused = visible.some((w) => w.isFocused);

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
              className="os-interactive os-focus-ring group relative flex flex-col items-center px-1.5 pb-1 pt-0.5"
            >
              <div
                className={clsx(
                  'relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-150',
                  isFocused
                    ? 'bg-white/20 ring-1 ring-white/25'
                    : isOpen
                      ? 'bg-white/10'
                      : 'group-hover:bg-white/10'
                )}
              >
                <AppIcon
                  appType={appType}
                  size={24}
                  className={clsx(
                    isFocused || isOpen
                      ? 'text-white'
                      : 'text-[var(--text-muted)] group-hover:text-white'
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
              <div className="mt-1 flex h-1.5 w-full items-center justify-center">
                {isOpen && (
                  <span
                    className={clsx(
                      'h-1 w-1 rounded-full',
                      isFocused ? 'bg-white' : 'bg-white/60',
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
