'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { APP_VERSION } from '@/lib/constants';

const BOOT_LOGS = [
  'Initializing kernel...',
  'Loading memory manager...',
  'Starting process scheduler (Round Robin)...',
  'Mounting host filesystem bridge...',
  'Connecting to hardware bridge (systeminformation)...',
  'Starting WebSocket daemon on :3000...',
  'Loading desktop environment...',
  'WebOS ready.',
];

export function BootScreen() {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(100, p + 2.5));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const idx = Math.floor((progress / 100) * BOOT_LOGS.length);
    setLogs(BOOT_LOGS.slice(0, Math.max(1, idx)));
  }, [progress]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[var(--os-bg)] font-mono">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-bold text-white shadow-lg shadow-black/30">
          W
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-[0.25em] text-[var(--text-primary)]">
            WEBOS
          </h1>
          <p className="text-[10px] text-[var(--text-muted)]">
            v{APP_VERSION} · host bridge
          </p>
        </div>
        <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
      </div>
      <div className="mb-6 h-1.5 w-80 max-w-[90vw] overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-[var(--separator)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] via-emerald-400 to-blue-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="h-44 w-[36rem] max-w-[90vw] space-y-1 overflow-hidden text-xs">
        {logs.map((line, i) => (
          <div
            key={i}
            className="animate-[boot-fade_0.3s_ease-in] text-emerald-500/90"
          >
            <span className="text-[var(--text-subtle)]">
              [{new Date().toISOString().slice(11, 19)}]
            </span>{' '}
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
