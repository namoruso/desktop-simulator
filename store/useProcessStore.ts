import { create } from 'zustand';
import type {
  OSProcess,
  SchedulerAlgorithm,
  SchedulerState,
} from '@/types/process.types';
import type { SystemSnapshot } from '@/types/system.types';
import {
  getNextPid,
  buildReadyQueue,
  rotateQueue,
  pickSchedulerProcesses,
} from '@/lib/scheduler';
import { rawProcessesToMap } from '@/lib/processMapper';
import { useMemoryStore } from '@/store/useMemoryStore';

export type KillMode = 'simulation' | 'host';

interface ProcessStore {
  processes: Map<number, OSProcess>;
  scheduler: SchedulerState;
  cpuHistory: number[];
  suspendedPids: Set<number>;
  updateFromSnapshot: (snapshot: SystemSnapshot) => void;
  killProcess: (pid: number, mode?: KillMode) => Promise<void>;
  suspendProcess: (pid: number) => void;
  resumeProcess: (pid: number) => void;
  triggerIoWait: (pid: number, ms: number) => void;
  setSchedulerAlgorithm: (algo: SchedulerAlgorithm) => void;
  setQuantum: (ms: number) => void;
  pauseScheduler: () => void;
  resumeScheduler: () => void;
  setSpeedMultiplier: (x: number) => void;
  tickScheduler: () => void;
  addSyntheticProcess: (p: Partial<OSProcess>) => void;
}

const initialScheduler: SchedulerState = {
  algorithm: 'RR',
  quantumMs: 100,
  isRunning: false,
  isPaused: false,
  currentPid: null,
  readyQueue: [],
  blockedQueue: [],
  tickCount: 0,
  speedMultiplier: 1,
};

function isSchedulable(
  proc: OSProcess,
  suspendedPids: Set<number>
): boolean {
  if (proc.state === 'terminated' || proc.state === 'suspended') return false;
  if (suspendedPids.has(proc.pid)) return false;
  if (proc.ioWaitMs > 0) return false;
  return true;
}

export const useProcessStore = create<ProcessStore>((set, get) => ({
  processes: new Map(),
  scheduler: initialScheduler,
  cpuHistory: [],
  suspendedPids: new Set(),

  updateFromSnapshot: (snapshot) => {
    const { scheduler, processes, suspendedPids } = get();
    const updated = rawProcessesToMap(
      snapshot.processes,
      processes,
      scheduler.currentPid
    );

    const schedulerPids = new Set(
      pickSchedulerProcesses([...updated.values()]).map((p) => p.pid)
    );

    for (const [pid, proc] of updated) {
      if (suspendedPids.has(pid)) {
        updated.set(pid, { ...proc, state: 'suspended' });
        continue;
      }
      if (proc.ioWaitMs > 0) {
        updated.set(pid, { ...proc, state: 'blocked' });
        continue;
      }
      if (!schedulerPids.has(pid)) {
        updated.set(pid, { ...proc, state: 'blocked' });
      } else if (
        proc.state === 'new' ||
        proc.state === 'blocked' ||
        proc.state === 'ready'
      ) {
        updated.set(pid, {
          ...proc,
          state: scheduler.currentPid === pid ? 'running' : 'ready',
        });
      }
    }

    const readyQueue = buildReadyQueue([...updated.values()], suspendedPids);
    const blockedQueue = [...updated.values()]
      .filter(
        (p) =>
          p.state === 'blocked' &&
          (p.ioWaitMs > 0 || !schedulerPids.has(p.pid))
      )
      .map((p) => p.pid);

    const cpuHistory = [...get().cpuHistory, snapshot.cpu.usage].slice(-60);

    set({
      processes: updated,
      cpuHistory,
      scheduler: {
        ...scheduler,
        readyQueue,
        blockedQueue,
      },
    });
  },

  killProcess: async (pid, mode = 'simulation') => {
    const proc = get().processes.get(pid);
    if (!proc || !proc.canBeKilled) return;

    if (mode === 'host') {
      try {
        const res = await fetch('/api/process/kill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pid, signal: 'SIGTERM' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Kill failed');
      } catch {
        return;
      }
    }

    set((state) => {
      const processes = new Map(state.processes);
      const p = processes.get(pid);
      if (p) {
        processes.set(pid, { ...p, state: 'terminated', ioWaitMs: 0 });
      }
      const suspendedPids = new Set(state.suspendedPids);
      suspendedPids.delete(pid);
      return {
        processes,
        suspendedPids,
        scheduler: {
          ...state.scheduler,
          readyQueue: state.scheduler.readyQueue.filter((id) => id !== pid),
          currentPid:
            state.scheduler.currentPid === pid
              ? null
              : state.scheduler.currentPid,
        },
      };
    });

    useMemoryStore.getState().freeProcessMemory(pid);
  },

  suspendProcess: (pid) => {
    set((state) => {
      const processes = new Map(state.processes);
      const proc = processes.get(pid);
      if (!proc || proc.state === 'terminated') return state;
      const suspendedPids = new Set(state.suspendedPids);
      suspendedPids.add(pid);
      processes.set(pid, {
        ...proc,
        state: 'suspended',
        ioWaitMs: 0,
      });
      return {
        processes,
        suspendedPids,
        scheduler: {
          ...state.scheduler,
          readyQueue: state.scheduler.readyQueue.filter((id) => id !== pid),
          currentPid:
            state.scheduler.currentPid === pid
              ? null
              : state.scheduler.currentPid,
        },
      };
    });
  },

  resumeProcess: (pid) => {
    set((state) => {
      const processes = new Map(state.processes);
      const proc = processes.get(pid);
      if (!proc || proc.state === 'terminated') return state;
      const suspendedPids = new Set(state.suspendedPids);
      suspendedPids.delete(pid);
      processes.set(pid, { ...proc, state: 'ready' });
      return { processes, suspendedPids };
    });
  },

  triggerIoWait: (pid, ms) => {
    set((state) => {
      const processes = new Map(state.processes);
      const proc = processes.get(pid);
      if (!proc || proc.state === 'terminated' || proc.state === 'suspended') {
        return state;
      }
      processes.set(pid, {
        ...proc,
        state: 'blocked',
        ioWaitMs: Math.max(proc.ioWaitMs, ms),
      });
      return {
        processes,
        scheduler: {
          ...state.scheduler,
          currentPid:
            state.scheduler.currentPid === pid
              ? null
              : state.scheduler.currentPid,
        },
      };
    });
  },

  setSchedulerAlgorithm: (algo) =>
    set((s) => ({ scheduler: { ...s.scheduler, algorithm: algo } })),

  setQuantum: (ms) =>
    set((s) => ({ scheduler: { ...s.scheduler, quantumMs: ms } })),

  pauseScheduler: () =>
    set((s) => ({ scheduler: { ...s.scheduler, isPaused: true } })),

  resumeScheduler: () =>
    set((s) => ({ scheduler: { ...s.scheduler, isPaused: false } })),

  setSpeedMultiplier: (x) =>
    set((s) => ({ scheduler: { ...s.scheduler, speedMultiplier: x } })),

  tickScheduler: () => {
    const { processes, scheduler, suspendedPids } = get();
    if (!scheduler.isRunning || scheduler.isPaused) return;

    const quantumMs = scheduler.quantumMs;
    const next = new Map(processes);

    for (const [pid, proc] of next) {
      if (proc.ioWaitMs > 0 && proc.state !== 'terminated') {
        const remaining = Math.max(0, proc.ioWaitMs - quantumMs);
        if (remaining > 0) {
          next.set(pid, { ...proc, ioWaitMs: remaining, state: 'blocked' });
        } else {
          next.set(pid, {
            ...proc,
            ioWaitMs: 0,
            state: suspendedPids.has(pid) ? 'suspended' : 'ready',
          });
        }
      }
    }

    const schedulerPids = new Set(
      pickSchedulerProcesses([...next.values()]).map((p) => p.pid)
    );
    const list = [...next.values()].filter(
      (p) => p.state !== 'terminated' && schedulerPids.has(p.pid)
    );

    let { readyQueue, blockedQueue, currentPid, tickCount } = scheduler;
    const current = currentPid ? next.get(currentPid) : undefined;

    if (
      current &&
      (current.state === 'suspended' ||
        suspendedPids.has(current.pid) ||
        current.ioWaitMs > 0)
    ) {
      currentPid = null;
    }

    if (scheduler.algorithm === 'RR' && current?.state === 'running') {
      const newQuantum = Math.max(0, current.quantum - quantumMs);
      if (newQuantum > 0) {
        next.set(current.pid, { ...current, quantum: newQuantum });
        set({
          processes: next,
          scheduler: {
            ...scheduler,
            blockedQueue: buildBlockedQueue(next, schedulerPids, suspendedPids),
            tickCount: tickCount + 1,
          },
        });
        return;
      }
      if (current) {
        next.set(current.pid, {
          ...current,
          state: 'ready',
          quantum: quantumMs,
        });
        readyQueue = rotateQueue(readyQueue, current.pid);
      }
    }

    const schedulable = [...next.values()].filter((p) =>
      isSchedulable(p, suspendedPids)
    );

    const nextPid = getNextPid(scheduler.algorithm, schedulable, {
      ...scheduler,
      readyQueue: buildReadyQueue(schedulable, suspendedPids),
      currentPid: null,
    });

    for (const [pid, proc] of next) {
      if (proc.state === 'running' && pid !== nextPid) {
        next.set(pid, { ...proc, state: 'ready', quantum: quantumMs });
      }
    }

    if (nextPid !== null) {
      const proc = next.get(nextPid);
      if (proc && isSchedulable(proc, suspendedPids)) {
        next.set(nextPid, {
          ...proc,
          state: 'running',
          quantum: quantumMs,
        });
        readyQueue = readyQueue.filter((p) => p !== nextPid);
        currentPid = nextPid;
      } else {
        currentPid = null;
      }
    } else {
      currentPid = null;
    }

    if (scheduler.algorithm === 'FIFO' && current?.state === 'running') {
      const c = next.get(current.pid);
      if (c && isSchedulable(c, suspendedPids)) {
        currentPid = current.pid;
      }
    }

    if (Math.random() < 0.08 && currentPid) {
      const proc = next.get(currentPid);
      if (proc && proc.state === 'running') {
        next.set(currentPid, {
          ...proc,
          state: 'blocked',
          ioWaitMs: quantumMs * 2,
        });
        currentPid = null;
      }
    }

    set({
      processes: next,
      scheduler: {
        ...scheduler,
        currentPid,
        readyQueue: buildReadyQueue([...next.values()], suspendedPids),
        blockedQueue: buildBlockedQueue(next, schedulerPids, suspendedPids),
        tickCount: tickCount + 1,
      },
    });
  },

  addSyntheticProcess: (partial) => {
    const pid = partial.pid ?? Math.floor(Math.random() * 90000) + 10000;
    const proc: OSProcess = {
      pid,
      name: partial.name ?? 'synthetic',
      path: partial.path ?? '/tmp/synthetic',
      state: partial.state ?? 'ready',
      priority: partial.priority ?? 10,
      cpuUsage: partial.cpuUsage ?? 0,
      memoryMB: partial.memoryMB ?? 10,
      memoryBlocks: partial.memoryBlocks ?? [],
      isSystemProcess: false,
      canBeKilled: true,
      startTime: new Date(),
      quantum: partial.quantum ?? 100,
      ioWaitMs: 0,
      threads: 1,
    };
    set((s) => {
      const processes = new Map(s.processes);
      processes.set(pid, proc);
      return { processes };
    });
  },
}));

function buildBlockedQueue(
  processes: Map<number, OSProcess>,
  schedulerPids: Set<number>,
  suspendedPids: Set<number>
): number[] {
  return [...processes.values()]
    .filter(
      (p) =>
        p.state === 'blocked' ||
        p.ioWaitMs > 0 ||
        (!schedulerPids.has(p.pid) &&
          p.state !== 'terminated' &&
          !suspendedPids.has(p.pid))
    )
    .map((p) => p.pid);
}
