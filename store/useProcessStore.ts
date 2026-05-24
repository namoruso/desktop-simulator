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

interface ProcessStore {
  processes: Map<number, OSProcess>;
  scheduler: SchedulerState;
  cpuHistory: number[];
  updateFromSnapshot: (snapshot: SystemSnapshot) => void;
  killProcess: (pid: number) => void;
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

export const useProcessStore = create<ProcessStore>((set, get) => ({
  processes: new Map(),
  scheduler: initialScheduler,
  cpuHistory: [],

  updateFromSnapshot: (snapshot) => {
    const { scheduler, processes } = get();
    const updated = rawProcessesToMap(
      snapshot.processes,
      processes,
      scheduler.currentPid
    );

    const schedulerPids = new Set(
      pickSchedulerProcesses([...updated.values()]).map((p) => p.pid)
    );

    for (const [pid, proc] of updated) {
      if (!schedulerPids.has(pid)) {
        updated.set(pid, { ...proc, state: 'blocked' });
      } else if (proc.state === 'new' || proc.state === 'blocked') {
        updated.set(pid, {
          ...proc,
          state: scheduler.currentPid === pid ? 'running' : 'ready',
        });
      }
    }

    const readyQueue = buildReadyQueue([...updated.values()]);
    const cpuHistory = [...get().cpuHistory, snapshot.cpu.usage].slice(-60);

    set({
      processes: updated,
      cpuHistory,
      scheduler: {
        ...scheduler,
        readyQueue,
      },
    });
  },

  killProcess: (pid) => {
    set((state) => {
      const processes = new Map(state.processes);
      const proc = processes.get(pid);
      if (proc && proc.canBeKilled) {
        processes.set(pid, { ...proc, state: 'terminated' });
      }
      return {
        processes,
        scheduler: {
          ...state.scheduler,
          readyQueue: state.scheduler.readyQueue.filter((p) => p !== pid),
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
    const { processes, scheduler } = get();
    if (!scheduler.isRunning || scheduler.isPaused) return;

    const schedulerPids = new Set(
      pickSchedulerProcesses([...processes.values()]).map((p) => p.pid)
    );
    const list = [...processes.values()].filter(
      (p) => p.state !== 'terminated' && schedulerPids.has(p.pid)
    );
    const next = new Map(processes);
    let { readyQueue, blockedQueue, currentPid, tickCount } = scheduler;
    const quantumMs = scheduler.quantumMs;

    const current = currentPid ? next.get(currentPid) : undefined;

    if (scheduler.algorithm === 'RR' && current?.state === 'running') {
      const newQuantum = Math.max(0, current.quantum - quantumMs);
      if (newQuantum > 0) {
        next.set(current.pid, { ...current, quantum: newQuantum });
        set({
          processes: next,
          scheduler: { ...scheduler, tickCount: tickCount + 1 },
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

    const nextPid = getNextPid(scheduler.algorithm, [...next.values()], {
      ...scheduler,
      readyQueue,
      currentPid: null,
    });

    for (const [pid, proc] of next) {
      if (proc.state === 'running' && pid !== nextPid) {
        next.set(pid, { ...proc, state: 'ready', quantum: quantumMs });
      }
    }

    if (nextPid !== null) {
      const proc = next.get(nextPid);
      if (proc) {
        next.set(nextPid, {
          ...proc,
          state: 'running',
          quantum: quantumMs,
        });
        readyQueue = readyQueue.filter((p) => p !== nextPid);
      }
      currentPid = nextPid;
    } else {
      currentPid = null;
    }

    if (scheduler.algorithm === 'FIFO' && current?.state === 'running') {
      currentPid = current.pid;
    }

    const blocked = list
      .filter((p) => p.state === 'blocked')
      .map((p) => p.pid);

    set({
      processes: next,
      scheduler: {
        ...scheduler,
        currentPid,
        readyQueue: buildReadyQueue([...next.values()]),
        blockedQueue: blocked,
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
