'use client';

import { useEffect, useState } from 'react';
import {
  Palette,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
  Power,
  Info,
  Monitor,
  Bell,
  Globe,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';
import {
  useSettingsStore,
  type WallpaperStyle,
  type UiScale,
} from '@/store/useSettingsStore';
import { useProcessStore } from '@/store/useProcessStore';
import { useFileStore } from '@/store/useFileStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { useStorageStore } from '@/store/useStorageStore';
import { useOSStore } from '@/store/useOSStore';
import type { SchedulerAlgorithm } from '@/types/process.types';
import { SettingRow, Toggle, SectionTitle, ProgressBar } from '@/components/ui/os-ui';

type Category =
  | 'appearance'
  | 'display'
  | 'system'
  | 'storage'
  | 'network'
  | 'notifications'
  | 'privacy'
  | 'power'
  | 'about';

const NAV: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
  { id: 'display', label: 'Display', icon: <Monitor size={16} /> },
  { id: 'system', label: 'System', icon: <Cpu size={16} /> },
  { id: 'storage', label: 'Storage', icon: <HardDrive size={16} /> },
  { id: 'network', label: 'Network', icon: <Wifi size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'privacy', label: 'Privacy', icon: <Shield size={16} /> },
  { id: 'power', label: 'Power', icon: <Power size={16} /> },
  { id: 'about', label: 'About', icon: <Info size={16} /> },
];

export function Settings() {
  const [cat, setCat] = useState<Category>('appearance');
  const settings = useSettingsStore();
  const setAlgorithm = useProcessStore((s) => s.setSchedulerAlgorithm);
  const setQuantum = useProcessStore((s) => s.setQuantum);
  const resetFs = useFileStore((s) => s.reset);
  const netSnapshot = useNetworkStore((s) => s.snapshot);
  const scanNet = useNetworkStore((s) => s.scan);
  const storageSnapshot = useStorageStore((s) => s.snapshot);
  const scanStorage = useStorageStore((s) => s.scan);
  const shutdown = useOSStore((s) => s.shutdown);
  const restart = useOSStore((s) => s.restart);

  useEffect(() => {
    setAlgorithm(settings.schedulerAlgorithm);
    setQuantum(settings.quantumMs);
  }, [settings.schedulerAlgorithm, settings.quantumMs, setAlgorithm, setQuantum]);

  useEffect(() => {
    scanStorage();
  }, [scanStorage]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', settings.accentColor);
    document.documentElement.classList.toggle('night-mode', settings.nightMode);
    document.documentElement.dataset.uiScale = settings.uiScale;
  }, [settings.accentColor, settings.nightMode, settings.uiScale]);

  const handleResetFs = async () => {
    if (confirm('Reset virtual filesystem and I/O logs?')) await resetFs();
  };

  const handleClearStorage = () => {
    if (
      confirm(
        'Clear all WebOS local data (windows, settings)? The page will reload.'
      )
    ) {
      localStorage.clear();
      indexedDB.deleteDatabase('keyval-store');
      window.location.reload();
    }
  };

  return (
    <div className="flex h-full bg-[var(--app-bg)] text-sm">
      <nav className="flex w-44 shrink-0 flex-col border-r border-white/10 bg-black/25 py-2">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Settings
        </p>
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCat(item.id)}
            className={clsx(
              'mx-2 flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition',
              cat === item.id
                ? 'bg-[var(--accent)]/25 font-medium text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-auto p-5">
        {cat === 'appearance' && (
          <PanelContent title="Appearance">
            <SettingRow label="Accent color" hint="Used across windows and controls">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => settings.setAccentColor(e.target.value)}
                className="h-9 w-20 cursor-pointer rounded border border-white/10 bg-transparent"
              />
            </SettingRow>
            <SettingRow label="Wallpaper">
              <select
                value={settings.wallpaper}
                onChange={(e) =>
                  settings.setWallpaper(e.target.value as WallpaperStyle)
                }
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs"
              >
                <option value="aurora">Aurora</option>
                <option value="mountains">Mountains</option>
                <option value="gradient">Gradient mesh</option>
                <option value="solid">Solid dark</option>
              </select>
            </SettingRow>
            <SettingRow label="Night mode" hint="Darker UI chrome">
              <Toggle
                checked={settings.nightMode}
                onChange={settings.setNightMode}
              />
            </SettingRow>
            <SettingRow label="Desktop icons">
              <Toggle
                checked={settings.showDesktopIcons}
                onChange={settings.setShowDesktopIcons}
              />
            </SettingRow>
            <SettingRow label="Dock app labels">
              <Toggle
                checked={settings.showDockLabels}
                onChange={settings.setShowDockLabels}
              />
            </SettingRow>
            <SettingRow label="Reduce motion">
              <Toggle
                checked={settings.reduceMotion}
                onChange={settings.setReduceMotion}
              />
            </SettingRow>
          </PanelContent>
        )}

        {cat === 'display' && (
          <PanelContent title="Display">
            <SettingRow label="UI scale" hint="Density of controls and text">
              <select
                value={settings.uiScale}
                onChange={(e) =>
                  settings.setUiScale(e.target.value as UiScale)
                }
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs"
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="large">Large</option>
              </select>
            </SettingRow>
            <SettingRow label="Clock format">
              <select
                value={settings.timeFormat}
                onChange={(e) =>
                  settings.setTimeFormat(e.target.value as '12h' | '24h')
                }
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs"
              >
                <option value="24h">24-hour</option>
                <option value="12h">12-hour</option>
              </select>
            </SettingRow>
            <SettingRow label="Language">
              <select
                value={settings.language}
                onChange={(e) => settings.setLanguage(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </SettingRow>
          </PanelContent>
        )}

        {cat === 'system' && (
          <PanelContent title="System">
            <div className="mb-2">
              <SectionTitle>CPU scheduler (simulator)</SectionTitle>
            </div>
            <SettingRow label="Default algorithm">
              <select
                value={settings.schedulerAlgorithm}
                onChange={(e) => {
                  const v = e.target.value as SchedulerAlgorithm;
                  settings.setSchedulerAlgorithm(v);
                  setAlgorithm(v);
                }}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs"
              >
                <option value="RR">Round Robin</option>
                <option value="FIFO">FIFO</option>
                <option value="PRIORITY">Priority</option>
              </select>
            </SettingRow>
            <SettingRow label={`Time quantum: ${settings.quantumMs} ms`}>
              <input
                type="range"
                min={50}
                max={500}
                step={50}
                value={settings.quantumMs}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  settings.setQuantumMs(v);
                  setQuantum(v);
                }}
                className="w-40"
              />
            </SettingRow>
            <button
              type="button"
              onClick={() => settings.resetAll()}
              className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-300 hover:bg-white/5"
            >
              Reset settings to defaults
            </button>
          </PanelContent>
        )}

        {cat === 'storage' && (
          <PanelContent title="Storage">
            <button
              type="button"
              onClick={() => scanStorage()}
              className="mb-4 flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
            >
              <RefreshCw size={12} /> Rescan drives
            </button>
            {storageSnapshot ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
                  <p className="text-slate-300">
                    Physical RAM: <strong>{storageSnapshot.physicalRamGB} GB</strong>
                  </p>
                  <p className="mt-1 text-slate-500">
                    Swap: {storageSnapshot.swapUsedGB} / {storageSnapshot.swapTotalGB} GB used
                  </p>
                </div>
                {storageSnapshot.drives.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-200">
                        {d.label}
                        {d.isUSB && (
                          <span className="ml-2 text-amber-400">USB</span>
                        )}
                      </span>
                      <span className="text-slate-500">{d.filesystem}</span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">
                      {d.mount} · {d.device}
                    </p>
                    {d.totalGB > 0 && (
                      <div className="mt-2">
                        <ProgressBar percent={d.usedPercent} />
                        <p className="mt-1 text-[10px] text-slate-500">
                          {d.usedGB} GB used · {d.freeGB} GB free · {d.totalGB} GB total
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Scanning storage…</p>
            )}
            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={handleResetFs}
                className="block w-full rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5"
              >
                Reset virtual filesystem (IndexedDB)
              </button>
              <button
                type="button"
                onClick={handleClearStorage}
                className="block w-full rounded-lg border border-red-500/30 px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
              >
                Clear all local data and reload
              </button>
            </div>
          </PanelContent>
        )}

        {cat === 'network' && (
          <PanelContent title="Network">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs">
              <p className="text-slate-200">
                Connected: {netSnapshot?.activeSsid ?? 'Not connected'}
              </p>
              <p className="mt-1 text-slate-500">
                Source: {netSnapshot?.source ?? '—'} ·{' '}
                {netSnapshot?.networks.length ?? 0} networks
              </p>
              <button
                type="button"
                onClick={() => scanNet()}
                className="mt-3 flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-slate-200 hover:bg-white/15"
              >
                <RefreshCw size={12} /> Rescan Wi-Fi
              </button>
              <p className="mt-3 text-[10px] text-slate-600">
                Use the Wi-Fi icon in the menu bar to connect to a network.
              </p>
            </div>
          </PanelContent>
        )}

        {cat === 'notifications' && (
          <PanelContent title="Notifications">
            <SettingRow label="Enable notifications">
              <Toggle
                checked={settings.notificationsEnabled}
                onChange={settings.setNotificationsEnabled}
              />
            </SettingRow>
            <SettingRow label={`System volume: ${settings.volume}%`}>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.volume}
                onChange={(e) => settings.setVolume(Number(e.target.value))}
                className="w-40"
              />
            </SettingRow>
          </PanelContent>
        )}

        {cat === 'privacy' && (
          <PanelContent title="Privacy & security">
            <p className="text-xs leading-relaxed text-slate-400">
              WebOS runs locally on your machine. File Manager can read and copy files
              only under your home directory, /media, /run/media, and /mnt. No data is sent
              to external servers except when you browse the web in the Browser app.
            </p>
            <SettingRow label="Clear browsing data" hint="Reloads the simulator">
              <button
                type="button"
                onClick={handleClearStorage}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
              >
                Clear local data
              </button>
            </SettingRow>
          </PanelContent>
        )}

        {cat === 'power' && (
          <PanelContent title="Power">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={restart}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm hover:bg-white/10"
              >
                Restart WebOS
              </button>
              <button
                type="button"
                onClick={shutdown}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-3 text-sm text-red-300 hover:bg-red-500/20"
              >
                Shut down
              </button>
            </div>
          </PanelContent>
        )}

        {cat === 'about' && (
          <PanelContent title="About WebOS">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white shadow-lg">
                W
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">WebOS Simulator</h2>
                <p className="text-xs text-slate-500">Version 2.0 · Next.js 14</p>
              </div>
            </div>
            <ul className="mt-6 space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Globe size={14} /> Live host metrics via systeminformation
              </li>
              <li className="flex items-center gap-2">
                <HardDrive size={14} /> Real disk and USB detection (lsblk, /media)
              </li>
              <li className="flex items-center gap-2">
                <Wifi size={14} /> Wi-Fi scan via NetworkManager (nmcli)
              </li>
            </ul>
          </PanelContent>
        )}
      </div>
    </div>
  );
}

function PanelContent({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}
