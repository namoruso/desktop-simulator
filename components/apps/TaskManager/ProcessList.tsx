'use client';

import { useState } from 'react';
import { useProcessStore } from '@/store/useProcessStore';
import { useToastStore } from '@/store/useToastStore';
import type { ProcessState } from '@/types/process.types';
import { ConfirmDialog } from '@/components/ui/OSDialog';

const STATE_COLORS: Record<ProcessState, string> = {
  running: 'var(--state-running)',
  ready: 'var(--state-ready)',
  blocked: 'var(--state-blocked)',
  suspended: '#60a5fa',
  terminated: 'var(--state-terminated)',
  new: 'var(--state-ready)',
};

export function ProcessList() {
  const processes = useProcessStore((s) => s.processes);
  const killProcess = useProcessStore((s) => s.killProcess);
  const suspendProcess = useProcessStore((s) => s.suspendProcess);
  const resumeProcess = useProcessStore((s) => s.resumeProcess);
  const [hostKillPid, setHostKillPid] = useState<number | null>(null);

  const list = [...processes.values()]
    .filter((p) => p.state !== 'terminated')
    .sort((a, b) => b.cpuUsage - a.cpuUsage)
    .slice(0, 80);

  const handleHostKill = async () => {
    if (hostKillPid == null) return;
    await killProcess(hostKillPid, 'host');
    const proc = processes.get(hostKillPid);
    useToastStore
      .getState()
      .push(
        proc
          ? `Sent SIGTERM to ${proc.name} (PID ${hostKillPid})`
          : `Kill signal sent to PID ${hostKillPid}`,
        'success'
      );
    setHostKillPid(null);
  };

  return (
    <div className="overflow-x-auto">
      <p className="mb-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
        Live host processes (systeminformation). <strong>Sim Kill</strong> updates
        WebOS only. <strong>Host Kill</strong> sends SIGTERM to the real process.
        Suspend/resume affect the scheduler simulation only.
      </p>
      <div className="mac-table-wrap">
      <table className="mac-table">
        <thead>
          <tr>
            <th className="px-2 py-1">PID</th>
            <th className="px-2 py-1">Name</th>
            <th className="px-2 py-1">State</th>
            <th className="px-2 py-1">I/O wait</th>
            <th className="px-2 py-1">CPU%</th>
            <th className="px-2 py-1">RAM</th>
            <th className="px-2 py-1">Pri</th>
            <th className="px-2 py-1">Thr</th>
            <th className="px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr
              key={p.pid}
              className="border-b border-white/5"
              style={{ borderLeft: `3px solid ${STATE_COLORS[p.state]}` }}
            >
              <td className="px-2 py-1 font-mono">{p.pid}</td>
              <td className="max-w-[140px] truncate px-2 py-1">{p.name}</td>
              <td className="px-2 py-1 capitalize">{p.state}</td>
              <td className="px-2 py-1 text-[var(--text-muted)]">
                {p.ioWaitMs > 0 ? `${p.ioWaitMs}ms` : '—'}
              </td>
              <td className="px-2 py-1">{p.cpuUsage.toFixed(1)}</td>
              <td className="px-2 py-1">{p.memoryMB}</td>
              <td className="px-2 py-1">{p.priority}</td>
              <td className="px-2 py-1">{p.threads}</td>
              <td className="px-2 py-1">
                <div className="flex flex-wrap gap-1">
                  {p.state === 'suspended' ? (
                    <ActionBtn label="Resume" onClick={() => resumeProcess(p.pid)} />
                  ) : (
                    <ActionBtn
                      label="Suspend"
                      disabled={p.state === 'terminated'}
                      onClick={() => suspendProcess(p.pid)}
                    />
                  )}
                  <ActionBtn
                    label="Sim"
                    disabled={!p.canBeKilled}
                    onClick={() => void killProcess(p.pid, 'simulation')}
                  />
                  <ActionBtn
                    label="Host"
                    disabled={!p.canBeKilled}
                    onClick={() => setHostKillPid(p.pid)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <ConfirmDialog
        open={hostKillPid !== null}
        title="Terminate host process"
        message={
          hostKillPid != null
            ? `Send SIGTERM to PID ${hostKillPid} (${processes.get(hostKillPid)?.name ?? 'unknown'})? This stops the real process on your machine.`
            : ''
        }
        confirmLabel="Terminate"
        variant="danger"
        onCancel={() => setHostKillPid(null)}
        onConfirm={() => void handleHostKill()}
      />
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mac-btn mac-btn-default mac-btn-sm px-1.5 py-0.5 text-[9px] disabled:opacity-30"
    >
      {label}
    </button>
  );
}
