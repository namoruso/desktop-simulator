'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { AppIcon } from '@/lib/appIcons';
import { useProcessStore } from '@/store/useProcessStore';
import { useWindowStore } from '@/store/useWindowStore';
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
  const windows = useWindowStore((s) => s.windows);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
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
    <div className="space-y-4 overflow-x-auto">
      <section>
        <h3 className="mac-section-title mb-2">WebOS applications</h3>
        <p className="mb-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
          Open windows in the simulator. Close or focus them here — same as the
          red traffic-light button.
        </p>
        {windows.length === 0 ? (
          <p className="mac-panel text-[12px] text-[var(--text-muted)]">
            No apps open. Launch one from the Dock or desktop.
          </p>
        ) : (
          <div className="mac-table-wrap">
            <table className="mac-table">
              <thead>
                <tr>
                  <th>App</th>
                  <th>Window</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {windows.map((w) => (
                  <tr
                    key={w.id}
                    className={clsx(w.isFocused && 'bg-white/[0.03]')}
                    style={{
                      borderLeft: w.isFocused
                        ? '3px solid var(--accent)'
                        : undefined,
                    }}
                  >
                    <td className="px-2 py-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <AppIcon appType={w.appType} size={14} />
                        <span className="capitalize">
                          {w.appType.replace(/-/g, ' ')}
                        </span>
                      </span>
                    </td>
                    <td className="max-w-[160px] truncate px-2 py-1.5">
                      {w.title}
                    </td>
                    <td className="px-2 py-1.5 capitalize text-[var(--text-muted)]">
                      {w.isMinimized
                        ? 'minimized'
                        : w.isMaximized
                          ? 'maximized'
                          : w.isFocused
                            ? 'focused'
                            : 'open'}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-wrap gap-1">
                        {!w.isMinimized && !w.isFocused && (
                          <ActionBtn
                            label="Focus"
                            onClick={() => focusWindow(w.id)}
                          />
                        )}
                        {w.isMinimized && (
                          <ActionBtn
                            label="Restore"
                            onClick={() => focusWindow(w.id)}
                          />
                        )}
                        {!w.isMinimized && (
                          <ActionBtn
                            label="Min"
                            onClick={() => minimizeWindow(w.id)}
                          />
                        )}
                        <ActionBtn
                          label="Close"
                          onClick={() => closeWindow(w.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="mac-section-title mb-2">Host processes</h3>
        <p className="mb-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
          Live processes from your machine (systeminformation).{' '}
          <strong>Sim Kill</strong> updates WebOS only. <strong>Host Kill</strong>{' '}
          sends SIGTERM to the real process.
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
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-[var(--text-muted)]"
                  >
                    Waiting for host metrics…
                  </td>
                </tr>
              ) : (
                list.map((p) => (
                  <tr
                    key={p.pid}
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
                          <ActionBtn
                            label="Resume"
                            onClick={() => resumeProcess(p.pid)}
                          />
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

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
