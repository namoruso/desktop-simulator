'use client';

import type { AppType } from '@/types/window.types';
import { useSettingsStore } from '@/store/useSettingsStore';
import { AppIcon, APP_LABELS, DESKTOP_APPS } from '@/lib/appIcons';
import { launchApp } from '@/lib/launchApp';

export function DesktopIcons() {
  const show = useSettingsStore((s) => s.showDesktopIcons);

  if (!show) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 p-6 pt-4">
      <div className="grid w-fit grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {DESKTOP_APPS.map((appType) => (
          <button
            key={appType}
            type="button"
            onDoubleClick={() => launchApp(appType, true)}
            onClick={() => launchApp(appType)}
            className="pointer-events-auto group flex w-24 flex-col items-center gap-2 rounded-xl p-3 transition hover:bg-white/5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white/15 to-white/5 shadow-lg ring-1 ring-white/10 transition group-hover:scale-105 group-hover:ring-white/20">
              <AppIcon appType={appType} size={28} className="text-indigo-200" />
            </div>
            <span className="max-w-full truncate text-center text-[11px] font-medium text-slate-200 drop-shadow">
              {APP_LABELS[appType]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
