'use client';

import { RefreshCw } from 'lucide-react';

export function RestartScreen() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-black">
      <RefreshCw size={32} className="animate-spin text-[var(--accent)]" />
      <p className="font-mono text-sm text-[var(--text-muted)]">Restarting WebOS…</p>
    </div>
  );
}
