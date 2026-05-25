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
            className="os-interactive os-focus-ring pointer-events-auto group flex w-[5.5rem] flex-col items-center gap-1.5 rounded-lg p-2 hover:bg-white/[0.06] active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/10 bg-gradient-to-br from-white/18 to-white/[0.04] shadow-md shadow-black/25 transition duration-200 group-hover:scale-[1.04] group-hover:border-white/18">
              <AppIcon appType={appType} size={24} className="text-[var(--text-primary)]" />
            </div>
            <span className="line-clamp-2 w-full text-center text-[10px] font-medium leading-tight text-[var(--text-primary)] drop-shadow-sm">
              {APP_LABELS[appType]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
