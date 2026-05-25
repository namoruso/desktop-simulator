import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NetworkSnapshot } from '@/types/network.types';
import { useToastStore } from '@/store/useToastStore';

interface NetworkStore {
  snapshot: NetworkSnapshot | null;
  isScanning: boolean;
  isConnecting: boolean;
  lastError: string | null;
  preferredSsid: string | null;
  scan: () => Promise<void>;
  connect: (ssid: string, password?: string) => Promise<boolean>;
}

export const useNetworkStore = create<NetworkStore>()(
  persist(
    (set, get) => ({
      snapshot: null,
      isScanning: false,
      isConnecting: false,
      lastError: null,
      preferredSsid: null,

      scan: async () => {
        set({ isScanning: true, lastError: null });
        try {
          const res = await fetch('/api/network', { cache: 'no-store' });
          if (!res.ok) throw new Error('Scan failed');
          const snapshot: NetworkSnapshot = await res.json();
          set({ snapshot, isScanning: false });
        } catch (e) {
          set({
            isScanning: false,
            lastError: e instanceof Error ? e.message : 'Scan failed',
          });
        }
      },

      connect: async (ssid, password) => {
        set({ isConnecting: true, lastError: null });
        try {
          const res = await fetch('/api/network', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ssid, password }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Connect failed');

          if (!data.ok) {
            set({ isConnecting: false, lastError: data.message });
            useToastStore.getState().push(data.message, 'error');
            return false;
          }

          const toastVariant = data.simulated ? 'warning' : 'success';
          useToastStore.getState().push(data.message, toastVariant);

          set({
            snapshot: data.snapshot ?? get().snapshot,
            preferredSsid: ssid,
            isConnecting: false,
            lastError: null,
          });
          return true;
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Connect failed';
          set({ isConnecting: false, lastError: msg });
          useToastStore.getState().push(msg, 'error');
          return false;
        }
      },
    }),
    {
      name: 'webos-network',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ preferredSsid: s.preferredSsid }),
      skipHydration: true,
    }
  )
);
