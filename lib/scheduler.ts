import type { OSProcess, SchedulerAlgorithm, SchedulerState } from '@/types/process.types';

/** Max processes simulated in the scheduler (not all 150 host processes) */
export const SCHEDULER_PROCESS_LIMIT = 12;

export function pickSchedulerProcesses(processes: OSProcess[]): OSProcess[] {
  return [...processes]
    .filter((p) => p.state !== 'terminated')
    .sort((a, b) => b.cpuUsage + b.memoryMB * 0.1 - (a.cpuUsage + a.memoryMB * 0.1))
    .slice(0, SCHEDULER_PROCESS_LIMIT);
}

export function roundRobin(
  processes: OSProcess[],
  currentPid: number | null,
  readyQueue: number[]
): number | null {
  const ready = processes.filter((p) => p.state === 'ready');
  if (ready.length === 0 && !currentPid) return null;

  const current = processes.find((p) => p.pid === currentPid);
  if (current && current.state === 'running' && current.quantum > 0) {
    return currentPid;
  }

  if (readyQueue.length === 0) {
    return ready[0]?.pid ?? null;
  }
  return readyQueue[0] ?? null;
}

export function fifo(
  processes: OSProcess[],
  readyQueue: number[]
): number | null {
  const current = processes.find((p) => p.state === 'running');
  if (current) return current.pid;
  return readyQueue[0] ?? null;
}

export function priorityScheduling(processes: OSProcess[]): number | null {
  const ready = processes
    .filter((p) => p.state === 'ready')
    .sort((a, b) => a.priority - b.priority);
  return ready[0]?.pid ?? null;
}

export function getNextPid(
  algorithm: SchedulerAlgorithm,
  processes: OSProcess[],
  schedulerState: SchedulerState
): number | null {
  const processList = [...processes];
  switch (algorithm) {
    case 'RR':
      return roundRobin(
        processList,
        schedulerState.currentPid,
        schedulerState.readyQueue
      );
    case 'FIFO':
      return fifo(processList, schedulerState.readyQueue);
    case 'PRIORITY':
      return priorityScheduling(processList);
    default:
      return null;
  }
}

export function buildReadyQueue(
  processes: OSProcess[],
  suspendedPids?: Set<number>
): number[] {
  return pickSchedulerProcesses(processes)
    .filter(
      (p) =>
        p.state === 'ready' &&
        p.ioWaitMs <= 0 &&
        !(suspendedPids?.has(p.pid) ?? false)
    )
    .sort((a, b) => a.priority - b.priority)
    .map((p) => p.pid);
}

export function rotateQueue(queue: number[], pid: number): number[] {
  const idx = queue.indexOf(pid);
  if (idx === -1) return queue;
  const next = [...queue];
  next.splice(idx, 1);
  next.push(pid);
  return next;
}
