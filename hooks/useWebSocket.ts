'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useProcessStore } from '@/store/useProcessStore';
import { useMemoryStore } from '@/store/useMemoryStore';
import { useWindowStore } from '@/store/useWindowStore';
import { useSystemStore } from '@/store/useSystemStore';
import { useStorageStore } from '@/store/useStorageStore';
import { appendIOLog } from '@/lib/filesystem';
import type { SystemSnapshot, WSMessage } from '@/types/system.types';

function normalizeSnapshot(raw: SystemSnapshot): SystemSnapshot {
  return {
    ...raw,
    processes: raw.processes.map((p) => ({
      ...p,
      startTime:
        p.startTime instanceof Date
          ? p.startTime
          : new Date(p.startTime as unknown as string),
    })),
  };
}

function applySnapshot(payload: SystemSnapshot) {
  const snapshot = normalizeSnapshot(payload);
  const openWindows = useWindowStore.getState().windows.filter(
    (w) => !w.isMinimized
  ).length;
  useProcessStore.getState().updateFromSnapshot(snapshot);
  useMemoryStore.getState().updateFromSnapshot(snapshot, openWindows);
  useSystemStore.getState().setLastUpdate(snapshot.timestamp);
  if (snapshot.storage) {
    useStorageStore.getState().setSnapshot(snapshot.storage);
  }
}

let lastIOLog = 0;
function logSnapshotIO(bytes: number) {
  const now = Date.now();
  if (now - lastIOLog < 5000) return;
  lastIOLog = now;
  appendIOLog({
    direction: 'in',
    source: 'websocket',
    summary: 'System snapshot received',
    bytes,
  }).catch(() => {});
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const pollTimer = useRef<ReturnType<typeof setInterval>>();
  const useWs = useRef(true);

  const setStatus = useSystemStore((s) => s.setConnectionStatus);

  const startPolling = useCallback(() => {
    if (pollTimer.current) return;
    setStatus('polling');
    const poll = async () => {
      try {
        const res = await fetch('/api/system', { cache: 'no-store' });
        if (!res.ok) throw new Error('poll failed');
        const msg = await res.json();
        if (msg.payload) {
          applySnapshot(msg.payload);
          setStatus('polling');
        }
      } catch {
        setStatus('disconnected');
      }
    };
    poll();
    pollTimer.current = setInterval(poll, 1000);
  }, [setStatus]);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = undefined;
    }
  }, []);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    setStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws`;

    try {
      wsRef.current = new WebSocket(wsUrl);
    } catch {
      useWs.current = false;
      startPolling();
      return;
    }

    wsRef.current.onopen = () => {
      clearTimeout(reconnectTimer.current);
      stopPolling();
      setStatus('connected');
      useWs.current = true;
    };

    wsRef.current.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        if (msg.type === 'system_snapshot' && msg.payload) {
          applySnapshot(msg.payload);
          setStatus('connected');
          logSnapshotIO(event.data?.length ?? 0);
        }
      } catch (e) {
        console.error('[WS] Parse error:', e);
      }
    };

    wsRef.current.onclose = () => {
      setStatus('disconnected');
      if (useWs.current) {
        reconnectTimer.current = setTimeout(connect, 2000);
      }
      startPolling();
    };

    wsRef.current.onerror = () => {
      wsRef.current?.close();
      useWs.current = false;
      startPolling();
    };
  }, [setStatus, startPolling, stopPolling]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      stopPolling();
      wsRef.current?.close();
    };
  }, [connect, stopPolling]);
}
