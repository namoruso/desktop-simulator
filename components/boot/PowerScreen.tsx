'use client';

import { Power } from 'lucide-react';
import { useOSStore } from '@/store/useOSStore';

export function PowerScreen() {
  const boot = useOSStore((s) => s.boot);
  const version = useOSStore((s) => s.version);

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0f]">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(124,108,240,0.25), transparent)',
        }}
      />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/30">
          <span className="text-3xl font-bold text-white">W</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          WebOS
        </h1>
        <p className="mt-2 text-sm text-slate-500">Simulator {version}</p>
        <p className="mt-1 max-w-sm text-xs text-slate-600">
          Live system metrics from your machine · Process scheduler · Memory
          visualization
        </p>
        <button
          type="button"
          onClick={boot}
          className="mt-10 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98]"
        >
          <Power size={18} strokeWidth={2} />
          Power On
        </button>
      </div>
    </div>
  );
}
