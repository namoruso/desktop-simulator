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
import { AppShell } from '@/components/ui/AppShell';
import {
  useSettingsStore,
  type WallpaperStyle,
  type UiScale,
} from '@/store/useSettingsStore';
import { useProcessStore } from '@/store/useProcessStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { useStorageStore } from '@/store/useStorageStore';
import { useOSStore } from '@/store/useOSStore';
import type { SchedulerAlgorithm } from '@/types/process.types';
import { APP_VERSION } from '@/lib/constants';
import {
  MacPage,
  MacSettingsGroup,
  MacSettingsRow,
  MacToggle,
  MacSelect,
  MacColorPicker,
  MacRange,
  MacButton,
  SectionTitle,
  ProgressBar,
} from '@/components/ui/os-ui';
import { useHostAudio } from '@/hooks/useHostAudio';
import { ConfirmDialog } from '@/components/ui/OSDialog';

type SettingsConfirm = 'clearStorage' | null;

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
  { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
  { id: 'display', label: 'Display', icon: <Monitor size={15} /> },
  { id: 'system', label: 'System', icon: <Cpu size={15} /> },
  { id: 'storage', label: 'Storage', icon: <HardDrive size={15} /> },
  { id: 'network', label: 'Network', icon: <Wifi size={15} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { id: 'privacy', label: 'Privacy', icon: <Shield size={15} /> },
  { id: 'power', label: 'Power', icon: <Power size={15} /> },
  { id: 'about', label: 'About', icon: <Info size={15} /> },
];

export function Settings() {
  const [cat, setCat] = useState<Category>('appearance');
  const [confirm, setConfirm] = useState<SettingsConfirm>(null);
  const settings = useSettingsStore();
  const { volume, applyVolume } = useHostAudio();
  const setAlgorithm = useProcessStore((s) => s.setSchedulerAlgorithm);
  const setQuantum = useProcessStore((s) => s.setQuantum);
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

  const handleClearStorage = () => setConfirm('clearStorage');

  const runConfirmedAction = () => {
    if (confirm === 'clearStorage') {
      localStorage.clear();
      indexedDB.deleteDatabase('keyval-store');
      window.location.reload();
    }
    setConfirm(null);
  };

  return (
    <AppShell className="!min-h-0 !flex-row !bg-[var(--app-bg)]">
      <nav className="mac-settings-sidebar">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCat(item.id)}
            className={clsx(
              'mac-settings-nav-item',
              cat === item.id
                ? 'mac-settings-nav-item-active'
                : 'mac-settings-nav-item-inactive'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <main className="min-h-0 flex-1 overflow-auto bg-[var(--app-bg)] px-6 py-6">
        {cat === 'appearance' && (
          <MacPage title="Appearance">
            <MacSettingsGroup>
              <MacSettingsRow label="Accent color" hint="Highlights and focus rings">
                <MacColorPicker
                  value={settings.accentColor}
                  onChange={settings.setAccentColor}
                />
              </MacSettingsRow>
              <MacSettingsRow label="Wallpaper">
                <MacSelect
                  value={settings.wallpaper}
                  onChange={(v) => settings.setWallpaper(v as WallpaperStyle)}
                >
                  <option value="aurora">Aurora</option>
                  <option value="mountains">Mountains</option>
                  <option value="gradient">Gradient</option>
                  <option value="solid">Solid</option>
                </MacSelect>
              </MacSettingsRow>
              <MacSettingsRow label="Night mode" hint="Darker menu bar and dock">
                <MacToggle
                  checked={settings.nightMode}
                  onChange={settings.setNightMode}
                />
              </MacSettingsRow>
              <MacSettingsRow label="Desktop icons">
                <MacToggle
                  checked={settings.showDesktopIcons}
                  onChange={settings.setShowDesktopIcons}
                />
              </MacSettingsRow>
              <MacSettingsRow label="Dock app labels">
                <MacToggle
                  checked={settings.showDockLabels}
                  onChange={settings.setShowDockLabels}
                />
              </MacSettingsRow>
              <MacSettingsRow label="Reduce motion">
                <MacToggle
                  checked={settings.reduceMotion}
                  onChange={settings.setReduceMotion}
                />
              </MacSettingsRow>
            </MacSettingsGroup>
          </MacPage>
        )}

        {cat === 'display' && (
          <MacPage title="Display">
            <MacSettingsGroup>
              <MacSettingsRow label="UI scale">
                <MacSelect
                  value={settings.uiScale}
                  onChange={(v) => settings.setUiScale(v as UiScale)}
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Default</option>
                  <option value="large">Large</option>
                </MacSelect>
              </MacSettingsRow>
              <MacSettingsRow label="Clock format">
                <MacSelect
                  value={settings.timeFormat}
                  onChange={(v) =>
                    settings.setTimeFormat(v as '12h' | '24h')
                  }
                >
                  <option value="24h">24-hour</option>
                  <option value="12h">12-hour</option>
                </MacSelect>
              </MacSettingsRow>
              <MacSettingsRow label="Language">
                <MacSelect
                  value={settings.language}
                  onChange={settings.setLanguage}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </MacSelect>
              </MacSettingsRow>
            </MacSettingsGroup>
          </MacPage>
        )}

        {cat === 'system' && (
          <MacPage title="System">
            <SectionTitle>CPU scheduler (simulation)</SectionTitle>
            <MacSettingsGroup>
              <MacSettingsRow label="Algorithm">
                <MacSelect
                  value={settings.schedulerAlgorithm}
                  onChange={(v) => {
                    const algo = v as SchedulerAlgorithm;
                    settings.setSchedulerAlgorithm(algo);
                    setAlgorithm(algo);
                  }}
                >
                  <option value="RR">Round Robin</option>
                  <option value="FIFO">FIFO</option>
                  <option value="PRIORITY">Priority</option>
                </MacSelect>
              </MacSettingsRow>
              <MacSettingsRow label={`Time quantum — ${settings.quantumMs} ms`}>
                <MacRange
                  min={50}
                  max={500}
                  step={50}
                  value={settings.quantumMs}
                  onChange={(v) => {
                    settings.setQuantumMs(v);
                    setQuantum(v);
                  }}
                />
              </MacSettingsRow>
            </MacSettingsGroup>
            <MacButton onClick={() => settings.resetAll()}>
              Reset all settings
            </MacButton>
          </MacPage>
        )}

        {cat === 'storage' && (
          <MacPage title="Storage">
            <MacButton onClick={() => scanStorage()} className="mb-2">
              <RefreshCw size={14} className="mr-1.5 inline" />
              Rescan drives
            </MacButton>
            {storageSnapshot ? (
              <div className="space-y-3">
                <MacSettingsGroup>
                  <div className="px-4 py-3 text-[13px] text-[var(--text-muted)]">
                    <p>
                      Physical RAM:{' '}
                      <strong className="text-[var(--text-primary)]">
                        {storageSnapshot.physicalRamGB} GB
                      </strong>
                    </p>
                    <p className="mt-1">
                      Swap: {storageSnapshot.swapUsedGB} /{' '}
                      {storageSnapshot.swapTotalGB} GB
                    </p>
                  </div>
                </MacSettingsGroup>
                {storageSnapshot.drives.map((d) => (
                  <MacSettingsGroup key={d.id}>
                    <div className="px-4 py-3">
                      <div className="flex justify-between text-[13px]">
                        <span className="font-medium text-[var(--text-primary)]">
                          {d.label}
                          {d.isUSB && (
                            <span className="ml-2 text-amber-400">USB</span>
                          )}
                        </span>
                        <span className="text-[var(--text-muted)]">
                          {d.filesystem}
                        </span>
                      </div>
                      {d.totalGB > 0 && (
                        <div className="mt-2">
                          <ProgressBar percent={d.usedPercent} />
                          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                            {d.usedGB} GB used · {d.freeGB} GB free
                          </p>
                        </div>
                      )}
                    </div>
                  </MacSettingsGroup>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[var(--text-muted)]">Scanning…</p>
            )}
            <MacButton variant="danger" onClick={handleClearStorage}>
              Clear WebOS local data
            </MacButton>
          </MacPage>
        )}

        {cat === 'network' && (
          <MacPage title="Network">
            <MacSettingsGroup>
              <div className="space-y-3 px-4 py-3 text-[13px]">
                <p className="text-[var(--text-primary)]">
                  Connected: {netSnapshot?.activeSsid ?? 'Not connected'}
                </p>
                <p className="text-[var(--text-muted)]">
                  {netSnapshot?.networks.length ?? 0} networks · source{' '}
                  {netSnapshot?.source ?? '—'}
                </p>
                <MacButton onClick={() => scanNet()}>Rescan Wi‑Fi</MacButton>
                <p className="text-[11px] text-[var(--text-subtle)]">
                  Use the Wi‑Fi menu in the menu bar to join a network.
                </p>
              </div>
            </MacSettingsGroup>
          </MacPage>
        )}

        {cat === 'notifications' && (
          <MacPage title="Notifications">
            <MacSettingsGroup>
              <MacSettingsRow label="Show toast notifications">
                <MacToggle
                  checked={settings.notificationsEnabled}
                  onChange={settings.setNotificationsEnabled}
                />
              </MacSettingsRow>
              <MacSettingsRow label={`System volume — ${volume}%`}>
                <MacRange
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(v) => void applyVolume(v)}
                />
              </MacSettingsRow>
            </MacSettingsGroup>
          </MacPage>
        )}

        {cat === 'privacy' && (
          <MacPage title="Privacy & Security">
            <p className="px-1 text-[13px] leading-relaxed text-[var(--text-muted)]">
              WebOS runs on your machine. File access is limited to your home
              directory and removable mounts. Only the Browser app contacts the
              internet.
            </p>
            <MacSettingsGroup>
              <MacSettingsRow label="Clear local data">
                <MacButton variant="danger" onClick={handleClearStorage}>
                  Clear & reload
                </MacButton>
              </MacSettingsRow>
            </MacSettingsGroup>
          </MacPage>
        )}

        {cat === 'power' && (
          <MacPage title="Power">
            <div className="flex flex-wrap gap-3">
              <MacButton onClick={restart}>Restart WebOS</MacButton>
              <MacButton variant="danger" onClick={shutdown}>
                Shut down
              </MacButton>
            </div>
          </MacPage>
        )}

        {cat === 'about' && (
          <MacPage title="About">
            <MacSettingsGroup>
              <div className="flex items-center gap-4 px-4 py-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-gradient-to-br from-[var(--accent)] to-violet-600 text-xl font-bold text-white shadow-lg">
                  W
                </div>
                <div>
                  <p className="text-[15px] font-semibold">WebOS Simulator</p>
                  <p className="text-[12px] text-[var(--text-muted)]">
                    Version {APP_VERSION}
                  </p>
                </div>
              </div>
            </MacSettingsGroup>
            <MacSettingsGroup>
              <div className="space-y-2 px-4 py-3 text-[13px] text-[var(--text-muted)]">
                <p className="flex items-center gap-2">
                  <Globe size={14} /> Live host metrics
                </p>
                <p className="flex items-center gap-2">
                  <HardDrive size={14} /> Real disks & USB
                </p>
                <p className="flex items-center gap-2">
                  <Wifi size={14} /> Wi‑Fi via NetworkManager
                </p>
              </div>
            </MacSettingsGroup>
          </MacPage>
        )}
      </main>

      <ConfirmDialog
        open={confirm === 'clearStorage'}
        title="Clear WebOS Data"
        message="Clear all WebOS local data (windows, settings)? The page will reload."
        confirmLabel="Clear & Reload"
        variant="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirmedAction()}
      />
    </AppShell>
  );
}
