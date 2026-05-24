import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OSState } from '@/types/os.types';

interface OSStore {
  osState: OSState;
  bootTimestamp: number | null;
  uptimeSeconds: number;
  osName: string;
  version: string;
  boot: () => void;
  shutdown: () => void;
  restart: () => void;
  sleep: () => void;
  wake: () => void;
  tickUptime: () => void;
}

export const useOSStore = create<OSStore>()(
  persist(
    (set) => ({
      osState: 'off',
      bootTimestamp: null,
      uptimeSeconds: 0,
      osName: 'WebOS',
      version: '1.0.0',

      boot: () =>
        set({
          osState: 'booting',
          bootTimestamp: Date.now(),
          uptimeSeconds: 0,
        }),

      shutdown: () => set({ osState: 'shuttingdown' }),
      restart: () => set({ osState: 'restarting' }),
      sleep: () => set({ osState: 'sleeping' }),
      wake: () => set({ osState: 'running' }),
      tickUptime: () =>
        set((s) => ({ uptimeSeconds: s.uptimeSeconds + 1 })),
    }),
    {
      name: 'webos-os-state-v2',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
