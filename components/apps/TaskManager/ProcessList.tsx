'use client';

import { useProcessStore } from '@/store/useProcessStore';
import type { ProcessState } from '@/types/process.types';

const STATE_COLORS: Record<ProcessState, string> = {
  running: 'var(--state-running)',
  ready: 'var(--state-ready)',
  blocked: 'var(--state-blocked)',
  terminated: 'var(--state-terminated)',
  new: 'var(--state-ready)',
};

export function ProcessList() {
  const processes = useProcessStore((s) => s.processes);
  const killProcess = useProcessStore((s) => s.killProcess);
  const list = [...processes.values()]
    .filter((p) => p.state !== 'terminated')
    .sort((a, b) => b.cpuUsage - a.cpuUsage)
    .slice(0, 80);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-white/10 text-slate-400">
            <th className="px-2 py-1">PID</th>
            <th className="px-2 py-1">Name</th>
            <th className="px-2 py-1">State</th>
            <th className="px-2 py-1">CPU%</th>
            <th className="px-2 py-1">RAM MB</th>
            <th className="px-2 py-1">Priority</th>
            <th className="px-2 py-1">Threads</th>
            <th className="px-2 py-1" />
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr
              key={p.pid}
              className="border-b border-white/5"
              style={{
                borderLeft: `3px solid ${STATE_COLORS[p.state]}`,
              }}
            >
              <td className="px-2 py-1 font-mono">{p.pid}</td>
              <td className="max-w-[180px] truncate px-2 py-1">{p.name}</td>
              <td className="px-2 py-1 capitalize">{p.state}</td>
              <td className="px-2 py-1">{p.cpuUsage.toFixed(1)}</td>
              <td className="px-2 py-1">{p.memoryMB}</td>
              <td className="px-2 py-1">{p.priority}</td>
              <td className="px-2 py-1">{p.threads}</td>
              <td className="px-2 py-1">
                <button
                  type="button"
                  disabled={!p.canBeKilled}
                  onClick={() => killProcess(p.pid)}
                  className="rounded bg-red-600/80 px-2 py-0.5 text-[10px] disabled:opacity-30"
                >
                  Kill
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
