import type { BlockType, MemoryBlock, MemoryMap } from '@/types/memory.types';
import type { RawProcess, SystemSnapshot } from '@/types/system.types';

const TOTAL_BLOCKS = 100;
const SIM_MB_PER_WINDOW = 48;
const SIM_BASE_MB = 64;

export function calcSimOverheadMB(openWindows: number): number {
  return SIM_BASE_MB + openWindows * SIM_MB_PER_WINDOW;
}

export function buildMemoryMap(
  snapshot: {
    memory: SystemSnapshot['memory'];
    processes: RawProcess[];
  },
  openWindows: number,
  leakedPids: Set<number> = new Set()
): MemoryMap {
  const { memory, processes } = snapshot;
  const totalMB = memory.totalMB;
  const mbPerBlock = totalMB / TOTAL_BLOCKS;

  const simUsedMB = Math.min(
    totalMB * 0.15,
    calcSimOverheadMB(openWindows)
  );
  const appsUsedMB = Math.min(memory.appsUsedMB, totalMB - simUsedMB);
  const cachedMB = Math.min(memory.cachedMB, totalMB);
  const availableMB = memory.availableMB;

  let appsBlocks = Math.round((appsUsedMB / totalMB) * TOTAL_BLOCKS);
  const simBlocks = Math.round((simUsedMB / totalMB) * TOTAL_BLOCKS);
  const cacheBlocks = Math.round((cachedMB / totalMB) * TOTAL_BLOCKS);
  let freeBlocks = Math.max(
    0,
    TOTAL_BLOCKS - appsBlocks - simBlocks - cacheBlocks
  );

  const sum = appsBlocks + simBlocks + cacheBlocks + freeBlocks;
  if (sum !== TOTAL_BLOCKS) {
    freeBlocks += TOTAL_BLOCKS - sum;
  }

  const blocks: MemoryBlock[] = Array.from({ length: TOTAL_BLOCKS }, (_, i) => ({
    index: i,
    sizeMB: mbPerBlock,
    pid: null,
    processName: null,
    type: 'free' as const,
    allocatedAt: null,
  }));

  let idx = 0;

  const fill = (count: number, type: BlockType, label: string) => {
    for (let i = 0; i < count && idx < TOTAL_BLOCKS; i++, idx++) {
      blocks[idx] = {
        ...blocks[idx],
        type,
        processName: label,
      };
    }
  };

  fill(cacheBlocks, 'cached', 'disk cache');
  fill(simBlocks, 'simulator', 'WebOS simulator');
  fill(Math.min(5, freeBlocks), 'system', 'kernel / OS');

  const topProcesses = processes
    .filter((p) => p.memMB > 0)
    .sort((a, b) => b.memMB - a.memMB)
    .slice(0, 30);

  const remainingAppBlocks = appsBlocks;
  let assigned = 0;
  for (const proc of topProcesses) {
    if (assigned >= remainingAppBlocks) break;
    const need = Math.max(
      1,
      Math.min(
        remainingAppBlocks - assigned,
        Math.round((proc.memMB / Math.max(appsUsedMB, 1)) * remainingAppBlocks)
      )
    );
    const blockType = leakedPids.has(proc.pid) ? ('leaked' as const) : ('user' as const);
    for (let j = 0; j < need && idx < TOTAL_BLOCKS; j++, idx++, assigned++) {
      blocks[idx] = {
        ...blocks[idx],
        pid: proc.pid,
        processName: proc.name,
        type: blockType,
        allocatedAt: new Date(),
      };
    }
  }

  while (assigned < remainingAppBlocks && idx < TOTAL_BLOCKS) {
    blocks[idx] = {
      ...blocks[idx],
      type: 'user',
      processName: 'apps',
    };
    idx++;
    assigned++;
  }

  while (idx < TOTAL_BLOCKS) {
    blocks[idx] = {
      ...blocks[idx],
      type: 'free',
      processName: null,
    };
    idx++;
  }

  const displayUsedMB = Math.min(totalMB, Math.round(appsUsedMB + simUsedMB));
  const displayUsedPercent =
    totalMB > 0
      ? Math.round((displayUsedMB / totalMB) * 1000) / 10
      : 0;

  return {
    totalMB,
    blocks,
    appsUsedMB: Math.round(appsUsedMB),
    simUsedMB: Math.round(simUsedMB),
    cachedMB,
    availableMB,
    hostUsedMB: memory.hostUsedMB,
    hostUsedPercent: memory.hostUsedPercent,
    displayUsedMB,
    displayUsedPercent,
    swapTotalMB: memory.swapTotalMB,
    swapUsedMB: memory.swapUsedMB,
    buffersMB: memory.buffersMB ?? 0,
    activeMB: memory.activeMB ?? 0,
    inactiveMB: memory.inactiveMB ?? 0,
    physicalTotalMB: memory.physicalTotalMB ?? totalMB,
  };
}
