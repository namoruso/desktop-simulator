'use client';

import clsx from 'clsx';
import { Wifi, RefreshCw, AlertTriangle } from 'lucide-react';
import { useSystemStore } from '@/store/useSystemStore';
import { useToastStore } from '@/store/useToastStore';
import { useEffect, useRef } from 'react';

export function ConnectionBanner() {
  const status = useSystemStore((s) => s.connectionStatus);
  const lastUpdate = useSystemStore((s) => s.lastUpdate);
  const push = useToastStore((s) => s.push);
  const prev = useRef(status);

  useEffect(() => {
    if (prev.current === status) return;
    if (status === 'disconnected' && prev.current === 'connected') {
      push('Lost connection to host metrics', 'error');
    }
    prev.current = status;
  }, [status, push]);

  if (status === 'connected') return null;

  const label =
    status === 'connecting'
      ? 'Connecting to host metrics…'
      : status === 'polling'
        ? 'Using HTTP fallback for system data'
        : 'Offline — system metrics unavailable';

  return (
    <div
      className={clsx(
        'relative z-[60] flex items-center justify-center gap-2 border-b px-3 py-1.5 text-[11px]',
        status === 'disconnected'
          ? 'border-red-500/30 bg-red-500/15 text-red-200'
          : 'border-amber-500/30 bg-amber-500/15 text-amber-200'
      )}
    >
      {status === 'polling' ? (
        <RefreshCw size={12} className="animate-spin" />
      ) : status === 'disconnected' ? (
        <AlertTriangle size={12} />
      ) : (
        <Wifi size={12} />
      )}
      <span>{label}</span>
      {lastUpdate && status === 'polling' && (
        <span className="text-amber-200/60">
          · updated {new Date(lastUpdate).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
