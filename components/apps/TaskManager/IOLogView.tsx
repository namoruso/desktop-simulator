'use client';

import { useEffect } from 'react';
import { format } from 'date-fns';
import { RefreshCw, Trash2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useIOStore } from '@/store/useIOStore';
import { Btn } from '@/components/ui/os-ui';

export function IOLogView() {
  const serverLogs = useIOStore((s) => s.serverLogs);
  const clientLogs = useIOStore((s) => s.clientLogs);
  const loading = useIOStore((s) => s.loading);
  const refresh = useIOStore((s) => s.refresh);
  const clearAll = useIOStore((s) => s.clearAll);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 3000);
    return () => clearInterval(id);
  }, [refresh]);

  const merged = [...serverLogs, ...clientLogs]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 150);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-slate-400">
          File, network, audio, and process events (server + browser IndexedDB).
        </p>
        <div className="flex gap-2">
          <Btn onClick={() => void refresh()} title="Refresh">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Btn>
          <Btn variant="danger" onClick={() => void clearAll()}>
            <Trash2 size={12} />
            Clear
          </Btn>
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto rounded-lg border border-white/10">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-black/60 text-slate-500">
            <tr>
              <th className="px-2 py-1.5">Time</th>
              <th className="px-2 py-1.5">Dir</th>
              <th className="px-2 py-1.5">Source</th>
              <th className="px-2 py-1.5">Summary</th>
              <th className="px-2 py-1.5">Bytes</th>
            </tr>
          </thead>
          <tbody>
            {merged.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No I/O events yet. Use File Manager, Wi‑Fi, or volume controls.
                </td>
              </tr>
            ) : (
              merged.map((log) => (
                <tr key={log.id} className="border-t border-white/5">
                  <td className="whitespace-nowrap px-2 py-1.5 font-mono text-[10px] text-slate-500">
                    {format(new Date(log.timestamp), 'HH:mm:ss')}
                  </td>
                  <td className="px-2 py-1.5">
                    {log.direction === 'in' ? (
                      <ArrowDownLeft size={14} className="text-sky-400" />
                    ) : (
                      <ArrowUpRight size={14} className="text-amber-400" />
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-slate-400">{log.source}</td>
                  <td className="max-w-[280px] truncate px-2 py-1.5 text-slate-200">
                    {log.summary}
                  </td>
                  <td className="px-2 py-1.5 text-slate-500">
                    {log.bytes != null ? log.bytes.toLocaleString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
