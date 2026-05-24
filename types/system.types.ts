export interface SystemSnapshot {
  timestamp: number;
  cpu: {
    usage: number;
    cores: number[];
    model: string;
    speed: number;
    temperature?: number;
  };
  memory: {
    totalMB: number;
    physicalTotalMB: number;
    appsUsedMB: number;
    availableMB: number;
    freeMB: number;
    activeMB: number;
    inactiveMB: number;
    buffersMB: number;
    cachedMB: number;
    hostUsedMB: number;
    hostUsedPercent: number;
    swapTotalMB: number;
    swapUsedMB: number;
  };
  storage?: import('@/types/storage.types').StorageSnapshot;
  processes: RawProcess[];
}

export interface RawProcess {
  pid: number;
  name: string;
  path: string;
  cpu: number;
  memMB: number;
  priority: number;
  threads: number;
  startTime: Date | string;
}

export type WSMessageType =
  | 'system_snapshot'
  | 'ping'
  | 'pong'
  | 'error';

export interface WSMessage {
  type: WSMessageType;
  payload: SystemSnapshot | null;
  timestamp: number;
}
