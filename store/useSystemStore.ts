import { create } from 'zustand';

export type ConnectionStatus = 'connecting' | 'connected' | 'polling' | 'disconnected';

interface SystemStore {
  connectionStatus: ConnectionStatus;
  lastUpdate: number | null;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLastUpdate: (ts: number) => void;
}

export const useSystemStore = create<SystemStore>((set) => ({
  connectionStatus: 'connecting',
  lastUpdate: null,
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setLastUpdate: (lastUpdate) => set({ lastUpdate }),
}));
