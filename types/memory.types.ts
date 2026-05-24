export type BlockType = 'free' | 'cached' | 'system' | 'user' | 'simulator' | 'leaked';

export interface MemoryBlock {
  index: number;
  sizeMB: number;
  pid: number | null;
  processName: string | null;
  type: BlockType;
  allocatedAt: Date | null;
}

export interface MemoryMap {
  totalMB: number;
  blocks: MemoryBlock[];
  appsUsedMB: number;
  simUsedMB: number;
  cachedMB: number;
  availableMB: number;
  hostUsedMB: number;
  hostUsedPercent: number;
  /** Apps + WebOS simulator overhead */
  displayUsedMB: number;
  displayUsedPercent: number;
  swapTotalMB: number;
  swapUsedMB: number;
  buffersMB: number;
  activeMB: number;
  inactiveMB: number;
  physicalTotalMB: number;
}
