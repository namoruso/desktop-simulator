export type ProcessState =
  | 'new'
  | 'ready'
  | 'running'
  | 'blocked'
  | 'suspended'
  | 'terminated';

export type SchedulerAlgorithm = 'RR' | 'FIFO' | 'PRIORITY';

export interface OSProcess {
  pid: number;
  name: string;
  path: string;
  state: ProcessState;
  priority: number;
  cpuUsage: number;
  memoryMB: number;
  memoryBlocks: number[];
  isSystemProcess: boolean;
  canBeKilled: boolean;
  startTime: Date;
  quantum: number;
  ioWaitMs: number;
  threads: number;
}

export interface SchedulerState {
  algorithm: SchedulerAlgorithm;
  quantumMs: number;
  isRunning: boolean;
  isPaused: boolean;
  currentPid: number | null;
  readyQueue: number[];
  blockedQueue: number[];
  tickCount: number;
  speedMultiplier: number;
}
