'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const BOOT_LOGS = [
  'Initializing kernel...',
  'Loading memory manager...',
  'Starting process scheduler (Round Robin)...',
  'Mounting virtual filesystem...',
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
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#050508] font-mono">
      <div className="mb-8 flex items-center gap-3">
        <Loader2 size={20} className="animate-spin text-indigo-400" />
        <h1 className="text-lg font-medium tracking-widest text-indigo-300">
          WEBOS v1.0.0
        </h1>
      </div>
      <div className="mb-6 h-1.5 w-80 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="h-44 w-[36rem] max-w-[90vw] space-y-1 overflow-hidden text-xs text-slate-500">
        {logs.map((line, i) => (
          <div
            key={i}
            className="animate-[boot-fade_0.3s_ease-in] text-emerald-600/80"
          >
            <span className="text-slate-600">
              [{new Date().toISOString().slice(11, 19)}]
            </span>{' '}
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
