import { create } from 'zustand';
import type { BatteryInfo } from '@/types/system.types';

export type ConnectionStatus = 'connecting' | 'connected' | 'polling' | 'disconnected';

interface SystemStore {
  connectionStatus: ConnectionStatus;
  lastUpdate: number | null;
  battery: BatteryInfo | null;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLastUpdate: (ts: number) => void;
  setBattery: (battery: BatteryInfo | null) => void;
}

export const useSystemStore = create<SystemStore>((set) => ({
  connectionStatus: 'connecting',
  lastUpdate: null,
  battery: null,
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setLastUpdate: (lastUpdate) => set({ lastUpdate }),
  setBattery: (battery) => set({ battery }),
}));
