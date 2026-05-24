'use client';

import { Power } from 'lucide-react';

export function ShutdownScreen() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-black">
      <Power size={32} className="text-slate-500" />
      <p className="font-mono text-sm text-slate-400">Shutting down WebOS…</p>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full animate-pulse rounded-full bg-slate-500" />
      </div>
    </div>
  );
}
