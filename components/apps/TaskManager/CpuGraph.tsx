'use client';

import { useProcessStore } from '@/store/useProcessStore';
import { useMemoryStore } from '@/store/useMemoryStore';
import { useStorageStore } from '@/store/useStorageStore';
import { ProgressBar } from '@/components/ui/os-ui';

export function CpuGraph() {
  const cpuHistory = useProcessStore((s) => s.cpuHistory);
  const m = useMemoryStore((s) => s.memoryMap);
  const storage = useStorageStore((s) => s.snapshot);

  const maxCpu = Math.max(100, ...cpuHistory, 1);
  const w = 400;
  const h = 120;
  const points = cpuHistory
    .map((v, i) => {
      const x = (i / Math.max(cpuHistory.length - 1, 1)) * w;
      const y = h - (v / maxCpu) * h;
      return `${x},${y}`;
    })
    .join(' ');

  const total = m.physicalTotalMB || m.totalMB || 1;
  const appsPct = (m.appsUsedMB / total) * 100;
  const simPct = (m.simUsedMB / total) * 100;
  const buffersPct = Math.min(15, ((m.buffersMB || 0) / total) * 100);
  const cachePct = Math.min(20, (m.cachedMB / total) * 100);
  const availPct = Math.max(
    0,
    100 - appsPct - simPct - cachePct - buffersPct
  );

  const swapPct =
    m.swapTotalMB > 0
      ? Math.round((m.swapUsedMB / m.swapTotalMB) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          CPU usage (host)
        </h3>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="rounded-xl bg-black/35 ring-1 ring-white/5">
          <defs>
            <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {points && (
            <polygon
              fill="url(#cpuGrad)"
              points={`0,${h} ${points} ${w},${h}`}
            />
          )}
          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            points={points || `0,${h}`}
          />
        </svg>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Physical memory ({m.physicalTotalMB || m.totalMB} MB)
        </h3>
        <div className="flex h-12 overflow-hidden rounded-xl bg-black/35 ring-1 ring-white/5">
          {appsPct > 0 && (
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${appsPct}%` }}
              title={`Apps ${m.appsUsedMB} MB`}
            />
          )}
          {simPct > 0 && (
            <div
              className="h-full bg-violet-500 transition-all"
              style={{ width: `${simPct}%` }}
              title={`WebOS ${m.simUsedMB} MB`}
            />
          )}
          {buffersPct > 0 && (
            <div
              className="h-full bg-cyan-800 transition-all"
              style={{ width: `${buffersPct}%` }}
              title={`Buffers ${m.buffersMB} MB`}
            />
          )}
          {cachePct > 0 && (
            <div
              className="h-full bg-slate-600 transition-all"
              style={{ width: `${cachePct}%` }}
              title={`Cache ${m.cachedMB} MB`}
            />
          )}
          {availPct > 0 && (
            <div
              className="h-full bg-emerald-800/90 transition-all"
              style={{ width: `${availPct}%` }}
              title={`Available ${m.availableMB} MB`}
            />
          )}
        </div>
        <ul className="mt-3 grid gap-1 text-[11px] text-slate-400 sm:grid-cols-2">
          <li>Applications (RSS): {m.appsUsedMB} MB</li>
          <li>WebOS simulator: {m.simUsedMB} MB</li>
          <li>Active: {m.activeMB} MB · Inactive: {m.inactiveMB} MB</li>
          <li>Buffers: {m.buffersMB} MB · Cache: {m.cachedMB} MB</li>
          <li>Available: {m.availableMB} MB</li>
          <li>Host pressure: {m.hostUsedPercent}%</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Swap
        </h3>
        <ProgressBar percent={swapPct} />
        <p className="mt-1 text-[11px] text-slate-500">
          {m.swapUsedMB} / {m.swapTotalMB} MB used
          {storage && ` · Physical RAM: ${storage.physicalRamGB} GB`}
        </p>
      </div>

      {storage && storage.drives.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Storage volumes
          </h3>
          <ul className="space-y-2">
            {storage.drives.slice(0, 6).map((d) => (
              <li
                key={d.id}
                className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[11px]"
              >
                <div className="flex justify-between text-slate-300">
                  <span>
                    {d.label}
                    {d.isUSB && (
                      <span className="ml-1 text-amber-400">USB</span>
                    )}
                  </span>
                  <span className="text-slate-500">{d.usedPercent}%</span>
                </div>
                <ProgressBar percent={d.usedPercent} className="mt-2" />
                <p className="mt-1 font-mono text-[10px] text-slate-600">
                  {d.mount}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
