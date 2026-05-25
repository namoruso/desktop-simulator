'use client';

import { Power } from 'lucide-react';
import { useOSStore } from '@/store/useOSStore';

export function PowerScreen() {
  const boot = useOSStore((s) => s.boot);
  const version = useOSStore((s) => s.version);

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#1c1c1e]">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(10,132,255,0.2), transparent)',
        }}
      />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[22px] bg-[var(--accent)] shadow-2xl shadow-black/40 ring-1 ring-white/15">
          <span className="text-3xl font-bold text-white">W</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
          WebOS
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Simulator {version}</p>
        <p className="mt-1 max-w-sm text-xs text-[var(--text-subtle)]">
          Live system metrics from your machine · Process scheduler · Memory
          visualization
        </p>
        <button
          type="button"
          onClick={boot}
          className="mac-btn mac-btn-primary mt-10 gap-2 rounded-full px-8 py-3.5 shadow-lg shadow-black/30 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <Power size={18} strokeWidth={2} />
          Power On
        </button>
      </div>
    </div>
  );
}
