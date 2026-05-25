'use client';

import { Power } from 'lucide-react';

export function ShutdownScreen() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-black">
      <Power size={32} className="text-[var(--text-muted)]" />
      <p className="font-mono text-sm text-[var(--text-muted)]">Shutting down WebOS…</p>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
        <div className="h-full animate-pulse rounded-full bg-[var(--accent)]" />
      </div>
    </div>
  );
}
