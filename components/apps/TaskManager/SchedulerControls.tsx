'use client';

import { useProcessStore } from '@/store/useProcessStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { SCHEDULER_PROCESS_LIMIT } from '@/lib/scheduler';
import type { SchedulerAlgorithm } from '@/types/process.types';
import { MacSelect, MacRange, MacButton } from '@/components/ui/os-ui';

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
    <div className="space-y-4 text-[13px]">
      <div className="mac-callout leading-relaxed">
        <p className="font-medium text-[var(--accent)]">CPU Scheduler (simulation)</p>
        <p className="mt-1 text-[var(--text-muted)]">
          WebOS does not control your real CPU. It simulates scheduling on the top{' '}
          {SCHEDULER_PROCESS_LIMIT} processes by load. States:{' '}
          <span className="text-emerald-400">running</span>,{' '}
          <span className="text-amber-400">ready</span>,{' '}
          <span className="text-red-400">blocked</span>,{' '}
          <span className="text-sky-400">suspended</span>.
        </p>
        {!scheduler.isRunning && (
          <p className="mt-2 text-amber-300">
            Scheduler is stopped. Reload the page or restart WebOS if controls appear inactive.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[var(--text-muted)]">Algorithm</span>
          <MacSelect
            value={scheduler.algorithm}
            onChange={(v) => {
              const algo = v as SchedulerAlgorithm;
              setAlgorithm(algo);
              persistSettings(algo, scheduler.quantumMs);
            }}
          >
            <option value="RR">Round Robin</option>
            <option value="FIFO">FIFO</option>
            <option value="PRIORITY">Priority</option>
          </MacSelect>
          <span className="text-[10px] text-[var(--text-subtle)]">
            {algoHelp[scheduler.algorithm]}
          </span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[var(--text-muted)]">
            Quantum: {scheduler.quantumMs} ms
          </span>
          <MacRange
            min={50}
            max={500}
            step={50}
            value={scheduler.quantumMs}
            onChange={(v) => {
              setQuantum(v);
              persistSettings(scheduler.algorithm, v);
            }}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[var(--text-muted)]">
            Demo speed: {scheduler.speedMultiplier}x
          </span>
          <MacSelect
            value={String(scheduler.speedMultiplier)}
            onChange={(v) => setSpeed(Number(v))}
          >
            <option value="0.5">0.5x (slow)</option>
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="4">4x (fast)</option>
          </MacSelect>
        </label>
        <div className="flex items-end">
          {scheduler.isPaused ? (
            <MacButton onClick={resume} variant="primary" className="w-full">
              Resume scheduler
            </MacButton>
          ) : (
            <MacButton onClick={pause} className="w-full">
              Pause scheduler
            </MacButton>
          )}
        </div>
      </div>

      <div className="mac-panel">
        <p>
          <span className="text-[var(--text-muted)]">Now on CPU:</span>{' '}
          <span className="font-medium text-emerald-400">
            {current ? `${current.name} (PID ${current.pid})` : '—'}
          </span>
        </p>
        <p className="mt-1 text-[var(--text-muted)]">
          Simulation ticks: {scheduler.tickCount}
        </p>
      </div>

      <div>
        <h4 className="mac-section-title mb-2">
          Ready queue ({readyProcs.length} processes)
        </h4>
        {readyProcs.length === 0 ? (
          <p className="mac-panel text-[var(--text-muted)]">Queue empty</p>
        ) : (
          <div className="mac-table-wrap">
            <table className="mac-table">
              <thead>
                <tr>
                  <th>PID</th>
                  <th>Process</th>
                  <th>Priority</th>
                  <th>CPU%</th>
                </tr>
              </thead>
              <tbody>
                {readyProcs.map((p) =>
                  p ? (
                    <tr key={p.pid}>
                      <td className="font-mono">{p.pid}</td>
                      <td className="max-w-[140px] truncate">{p.name}</td>
                      <td>{p.priority}</td>
                      <td>{p.cpuUsage.toFixed(1)}</td>
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h4 className="mac-section-title mb-1">
          Blocked queue ({scheduler.blockedQueue.length})
        </h4>
        <p className="text-[10px] text-[var(--text-muted)]">
          Waiting on simulated disk I/O or outside the top-{SCHEDULER_PROCESS_LIMIT}{' '}
          CPU simulation
        </p>
        {scheduler.blockedQueue.length > 0 && (
          <p className="mt-1 font-mono text-[10px] text-[var(--text-subtle)]">
            PIDs: {scheduler.blockedQueue.slice(0, 12).join(', ')}
            {scheduler.blockedQueue.length > 12 ? '…' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
