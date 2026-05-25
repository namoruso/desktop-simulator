'use client';

import { useProcessStore } from '@/store/useProcessStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { SCHEDULER_PROCESS_LIMIT } from '@/lib/scheduler';
import type { SchedulerAlgorithm } from '@/types/process.types';

export function SchedulerControls() {
  const scheduler = useProcessStore((s) => s.scheduler);
  const processes = useProcessStore((s) => s.processes);
  const setAlgorithm = useProcessStore((s) => s.setSchedulerAlgorithm);
  const setQuantum = useProcessStore((s) => s.setQuantum);
  const setSpeed = useProcessStore((s) => s.setSpeedMultiplier);
  const pause = useProcessStore((s) => s.pauseScheduler);
  const resume = useProcessStore((s) => s.resumeScheduler);
  const setSettingsAlgorithm = useSettingsStore((s) => s.setSchedulerAlgorithm);
  const setSettingsQuantum = useSettingsStore((s) => s.setQuantumMs);

  const current = scheduler.currentPid
    ? processes.get(scheduler.currentPid)
    : null;

  const readyProcs = scheduler.readyQueue
    .map((pid) => processes.get(pid))
    .filter(Boolean);

  const algoHelp: Record<SchedulerAlgorithm, string> = {
    RR: 'Each process gets a time slice (quantum), then goes to the back of the line. Fair for everyone.',
    FIFO: 'First process in the queue runs until it finishes — no preemption.',
    PRIORITY: 'Lowest priority number runs first (Unix nice). High priority can starve others.',
  };

  const persistSettings = (algorithm: SchedulerAlgorithm, quantumMs: number) => {
    setSettingsAlgorithm(algorithm);
    setSettingsQuantum(quantumMs);
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-3 leading-relaxed text-slate-300">
        <p className="font-medium text-indigo-200">CPU Scheduler (simulation)</p>
        <p className="mt-1 text-slate-400">
          WebOS does not control your real CPU. It simulates scheduling on the top{' '}
          {SCHEDULER_PROCESS_LIMIT} processes by load. States:{' '}
          <span className="text-emerald-400">running</span>,{' '}
          <span className="text-amber-400">ready</span> (waiting for CPU),{' '}
          <span className="text-red-400">blocked</span> (I/O wait or not in top{' '}
          {SCHEDULER_PROCESS_LIMIT}), <span className="text-sky-400">suspended</span>{' '}
          (user paused).
        </p>
        {!scheduler.isRunning && (
          <p className="mt-2 text-amber-300">
            Scheduler is stopped. Reload the page or restart WebOS if controls appear inactive.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          Algorithm
          <select
            value={scheduler.algorithm}
            onChange={(e) => {
              const v = e.target.value as SchedulerAlgorithm;
              setAlgorithm(v);
              persistSettings(v, scheduler.quantumMs);
            }}
            className="rounded border border-white/10 bg-black/30 px-2 py-1.5"
          >
            <option value="RR">Round Robin</option>
            <option value="FIFO">FIFO</option>
            <option value="PRIORITY">Priority</option>
          </select>
          <span className="text-[10px] text-slate-500">{algoHelp[scheduler.algorithm]}</span>
        </label>
        <label className="flex flex-col gap-1">
          Quantum: {scheduler.quantumMs} ms
          <input
            type="range"
            min={50}
            max={500}
            step={50}
            value={scheduler.quantumMs}
            onChange={(e) => {
              const v = Number(e.target.value);
              setQuantum(v);
              persistSettings(scheduler.algorithm, v);
            }}
            className="w-full"
          />
          <span className="text-[10px] text-slate-500">
            Time slice per process (Round Robin)
          </span>
        </label>
        <label className="flex flex-col gap-1">
          Demo speed: {scheduler.speedMultiplier}x
          <select
            value={scheduler.speedMultiplier}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rounded border border-white/10 bg-black/30 px-2 py-1.5"
          >
            <option value={0.5}>0.5x (slow)</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x (fast)</option>
          </select>
        </label>
        <div className="flex items-end">
          {scheduler.isPaused ? (
            <button
              type="button"
              onClick={resume}
              className="w-full rounded-lg bg-emerald-600 py-2 font-medium text-white"
            >
              Resume scheduler
            </button>
          ) : (
            <button
              type="button"
              onClick={pause}
              className="w-full rounded-lg bg-amber-600 py-2 font-medium text-white"
            >
              Pause scheduler
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
        <p>
          <span className="text-slate-500">Now on CPU:</span>{' '}
          <span className="font-medium text-emerald-400">
            {current ? `${current.name} (PID ${current.pid})` : '—'}
          </span>
        </p>
        <p className="mt-1 text-slate-500">
          Simulation ticks: {scheduler.tickCount}
        </p>
      </div>

      <div>
        <h4 className="mb-2 font-medium text-slate-300">
          Ready queue ({readyProcs.length} processes)
        </h4>
        {readyProcs.length === 0 ? (
          <p className="rounded-lg bg-black/20 p-3 text-slate-500">Queue empty</p>
        ) : (
          <table className="w-full overflow-hidden rounded-lg border border-white/10 text-left">
            <thead className="bg-black/30 text-slate-500">
              <tr>
                <th className="px-2 py-1.5">PID</th>
                <th className="px-2 py-1.5">Process</th>
                <th className="px-2 py-1.5">Priority</th>
                <th className="px-2 py-1.5">CPU%</th>
              </tr>
            </thead>
            <tbody>
              {readyProcs.map((p) =>
                p ? (
                  <tr key={p.pid} className="border-t border-white/5">
                    <td className="px-2 py-1.5 font-mono">{p.pid}</td>
                    <td className="max-w-[140px] truncate px-2 py-1.5">{p.name}</td>
                    <td className="px-2 py-1.5">{p.priority}</td>
                    <td className="px-2 py-1.5">{p.cpuUsage.toFixed(1)}</td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h4 className="mb-1 font-medium text-slate-300">
          Blocked queue ({scheduler.blockedQueue.length})
        </h4>
        <p className="text-[10px] text-slate-500">
          Waiting on simulated disk I/O or outside the top-{SCHEDULER_PROCESS_LIMIT}{' '}
          CPU simulation
        </p>
        {scheduler.blockedQueue.length > 0 && (
          <p className="mt-1 font-mono text-[10px] text-slate-500">
            PIDs: {scheduler.blockedQueue.slice(0, 12).join(', ')}
            {scheduler.blockedQueue.length > 12 ? '…' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
