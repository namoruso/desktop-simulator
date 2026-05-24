import { create } from 'zustand';
import type { MemoryMap } from '@/types/memory.types';
import type { SystemSnapshot } from '@/types/system.types';
import { buildMemoryMap } from '@/lib/memoryManager';

interface MemoryStore {
  memoryMap: MemoryMap;
  leakedPids: Set<number>;
  updateFromSnapshot: (snapshot: SystemSnapshot, openWindows?: number) => void;
  simulateMemoryLeak: (pid: number, mbPerTick: number) => void;
  freeProcessMemory: (pid: number) => void;
}

const emptyMap: MemoryMap = {
  totalMB: 0,
  blocks: [],
  appsUsedMB: 0,
  simUsedMB: 0,
  cachedMB: 0,
  availableMB: 0,
  hostUsedMB: 0,
  hostUsedPercent: 0,
  displayUsedMB: 0,
  displayUsedPercent: 0,
  swapTotalMB: 0,
  swapUsedMB: 0,
  buffersMB: 0,
  activeMB: 0,
  inactiveMB: 0,
  physicalTotalMB: 0,
};

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  memoryMap: emptyMap,
  leakedPids: new Set(),

  updateFromSnapshot: (snapshot, openWindows = 0) => {
    const { leakedPids } = get();
    const map = buildMemoryMap(snapshot, openWindows, leakedPids);
    set({ memoryMap: map });
  },

  simulateMemoryLeak: (pid) => {
    set((s) => {
      const leakedPids = new Set(s.leakedPids);
      leakedPids.add(pid);
      return { leakedPids };
    });
  },

  freeProcessMemory: (pid) => {
    set((s) => {
      const blocks = s.memoryMap.blocks.map((b) =>
        b.pid === pid
          ? {
              ...b,
              pid: null,
              processName: null,
              type: 'free' as const,
              allocatedAt: null,
            }
          : b
      );
      const leakedPids = new Set(s.leakedPids);
      leakedPids.delete(pid);
      return {
        memoryMap: { ...s.memoryMap, blocks },
        leakedPids,
      };
    });
  },
}));
