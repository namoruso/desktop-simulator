'use client';

import { format } from 'date-fns';
import { useEffect, useState, useRef } from 'react';
import {
  Power,
  RefreshCw,
  Activity,
  HardDrive,
  Search,
  Usb,
  Volume2,
} from 'lucide-react';
import clsx from 'clsx';
import { useOSStore } from '@/store/useOSStore';
import { useProcessStore } from '@/store/useProcessStore';
import { useMemoryStore } from '@/store/useMemoryStore';
import { useSystemStore } from '@/store/useSystemStore';
import { useStorageStore } from '@/store/useStorageStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useHostAudio } from '@/hooks/useHostAudio';
import { launchApp } from '@/lib/launchApp';
import { NetworkMenu } from './NetworkMenu';
import { NotificationCenter } from './NotificationCenter';

interface MenuBarProps {
  onSpotlight: () => void;
}

export function MenuBar({ onSpotlight }: MenuBarProps) {
  const [time, setTime] = useState(new Date());
  const osName = useOSStore((s) => s.osName);
  const uptimeSeconds = useOSStore((s) => s.uptimeSeconds);
  const shutdown = useOSStore((s) => s.shutdown);
  const restart = useOSStore((s) => s.restart);
  const cpuHistory = useProcessStore((s) => s.cpuHistory);
  const m = useMemoryStore((s) => s.memoryMap);
  const connectionStatus = useSystemStore((s) => s.connectionStatus);
  const usbCount = useStorageStore(
    (s) => s.snapshot?.drives.filter((d) => d.isUSB).length ?? 0
  );
  const timeFormat = useSettingsStore((s) => s.timeFormat);
  const { volume, applyVolume } = useHostAudio();
  const [volumeOpen, setVolumeOpen] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);

  const cpu = cpuHistory[cpuHistory.length - 1] ?? 0;
  const freePct =
    m.totalMB > 0 ? Math.round((m.availableMB / m.totalMB) * 100) : 0;
  const ramTitle = [
    `Free: ${m.availableMB} MB (${freePct}%)`,
    `Apps: ${m.appsUsedMB} MB`,
    `WebOS: ${m.simUsedMB} MB`,
    `Cache: ${m.cachedMB} MB`,
  ].join(' · ');

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) {
        setVolumeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const min = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${min}m ${sec}s`;
  };

  const live = connectionStatus === 'connected';
  const polling = connectionStatus === 'polling';

  return (
    <header className="menubar-glass relative z-50 flex h-7 shrink-0 items-center justify-between border-b border-[var(--separator)] px-3 text-[12px]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSpotlight}
          className="os-interactive os-focus-ring flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/[0.08]"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)] text-[10px] font-bold text-white shadow-sm ring-1 ring-white/15">
            W
          </div>
          <span className="hidden font-semibold tracking-tight text-[var(--text-primary)] sm:inline">
            {osName}
          </span>
        </button>

        <nav className="hidden items-center gap-0.5 md:flex">
          <MenuBtn label="File" onClick={() => launchApp('file-manager')} />
          <MenuBtn label="View" onClick={() => launchApp('task-manager')} />
          <MenuBtn label="System" onClick={() => launchApp('settings')} />
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Stat
            icon={<Activity size={12} className="text-emerald-400" />}
            label={`CPU ${cpu.toFixed(1)}%`}
            title="CPU usage"
          />
          <Stat
            icon={<HardDrive size={12} className="text-sky-400" />}
            label={`RAM ${freePct}%`}
            title={ramTitle}
          />
          {usbCount > 0 && (
            <Stat
              icon={<Usb size={12} className="text-amber-400" />}
              label={`${usbCount} USB`}
              title="Removable storage connected"
            />
          )}
          <span className="os-metric-pill" title="Simulator uptime">
            {formatUptime(uptimeSeconds)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSpotlight}
          className="os-interactive os-focus-ring flex items-center gap-1.5 rounded-md border border-[var(--separator)] bg-white/[0.04] px-2 py-1 text-[var(--text-muted)] hover:bg-white/[0.08] hover:text-[var(--text-primary)]"
          title="Search (Ctrl+K)"
        >
          <Search size={12} />
          <span className="hidden sm:inline">Search</span>
        </button>

        <NotificationCenter />

        <NetworkMenu />

        <div ref={volumeRef} className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setVolumeOpen((o) => !o)}
            className={clsx(
              'os-interactive os-focus-ring flex items-center gap-1 rounded-lg px-2 py-1.5',
              volumeOpen
                ? 'bg-white/15 text-white ring-1 ring-white/15'
                : 'text-[var(--text-muted)] hover:bg-white/[0.08] hover:text-[var(--text-primary)]'
            )}
            title="System volume"
          >
            <Volume2 size={12} />
            {volume}%
          </button>
          {volumeOpen && (
            <div className="os-glass-popover absolute right-0 top-full z-[200] mt-2 w-44 rounded-xl p-3">
              <p className="mb-2 text-[10px] text-[var(--text-muted)]">Host volume</p>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => void applyVolume(Number(e.target.value))}
                className="mac-range w-full"
              />
            </div>
          )}
        </div>

        <span
          className={clsx(
            'hidden h-2 w-2 rounded-full sm:inline',
            live && 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
            polling && 'bg-amber-400',
            !live && !polling && 'bg-red-500'
          )}
          title={live ? 'Live data' : polling ? 'Polling' : 'Offline'}
        />

        <button
          type="button"
          onClick={restart}
          className="mac-icon-btn p-1.5"
          title="Restart"
        >
          <RefreshCw size={14} />
        </button>
        <button
          type="button"
          onClick={shutdown}
          className="mac-icon-btn p-1.5"
          title="Shutdown"
        >
          <Power size={14} />
        </button>
        <span className="tabular-nums text-[12px] font-medium text-[var(--text-primary)]">
          {format(
            time,
            timeFormat === '12h' ? 'EEE d  h:mm a' : 'EEE d  HH:mm'
          )}
        </span>
      </div>
    </header>
  );
}

function MenuBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="os-interactive os-focus-ring rounded-md px-2 py-0.5 text-[var(--text-muted)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
    >
      {label}
    </button>
  );
}

function Stat({
  icon,
  label,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
}) {
  return (
    <span className="os-metric-pill" title={title}>
      {icon}
      {label}
    </span>
  );
}
