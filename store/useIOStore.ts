import { create } from 'zustand';
import { set as idbSet } from 'idb-keyval';
import type { IOLogEntry } from '@/types/filesystem.types';
import { loadIOLogs } from '@/lib/filesystem';

const IO_KEY = 'webos-io-logs';

interface IOStore {
  serverLogs: IOLogEntry[];
  clientLogs: IOLogEntry[];
  loading: boolean;
  refresh: () => Promise<void>;
  clearAll: () => Promise<void>;
}

function mapServerEntry(e: {
  id: string;
  timestamp: string;
  direction: 'in' | 'out';
  source: string;
  summary: string;
  bytes?: number;
}): IOLogEntry {
  return {
    id: e.id,
    timestamp: e.timestamp,
    direction: e.direction,
    source: e.source,
    summary: e.summary,
    bytes: e.bytes,
  };
}

export const useIOStore = create<IOStore>((set) => ({
  serverLogs: [],
  clientLogs: [],
  loading: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const [serverRes, clientLogs] = await Promise.all([
        fetch('/api/io-logs?limit=200', { cache: 'no-store' }),
        loadIOLogs(),
      ]);
      const serverData = serverRes.ok ? await serverRes.json() : { logs: [] };
      set({
        serverLogs: (serverData.logs ?? []).map(mapServerEntry),
        clientLogs,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  clearAll: async () => {
    await fetch('/api/io-logs', { method: 'DELETE' });
    await idbSet(IO_KEY, []);
    set({ serverLogs: [], clientLogs: [] });
  },
}));
