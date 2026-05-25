'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Check,
  Loader2,
  Cable,
} from 'lucide-react';
import clsx from 'clsx';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Btn } from '@/components/ui/os-ui';

function needsPassword(security: string): boolean {
  return !!security && security !== 'Open' && security !== '—';
}

export function NetworkMenu() {
  const [open, setOpen] = useState(false);
  const [passwordFor, setPasswordFor] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const snapshot = useNetworkStore((s) => s.snapshot);
  const isScanning = useNetworkStore((s) => s.isScanning);
  const isConnecting = useNetworkStore((s) => s.isConnecting);
  const lastError = useNetworkStore((s) => s.lastError);
  const scan = useNetworkStore((s) => s.scan);
  const connect = useNetworkStore((s) => s.connect);

  useEffect(() => {
    scan();
    const id = setInterval(scan, 30000);
    return () => clearInterval(id);
  }, [scan]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setPasswordFor(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const active = snapshot?.activeSsid;
  const signalIcon = snapshot?.wifiEnabled !== false;

  const connectTo = async (ssid: string, pwd?: string) => {
    await connect(ssid, pwd);
    await scan();
    setPasswordFor(null);
    setPassword('');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'flex items-center gap-1.5 rounded-md px-2 py-1 transition',
          open ? 'bg-white/15 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'
        )}
        title="Wi-Fi networks"
      >
        {signalIcon ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span className="max-w-[100px] truncate text-[10px]">
          {active || 'Wi-Fi'}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[200] mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-[rgba(18,22,32,0.98)] shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Wi-Fi</h3>
              <button
                type="button"
                onClick={() => scan()}
                disabled={isScanning}
                className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
              </button>
            </div>
            {snapshot?.ethernetConnected && (
              <p className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                <Cable size={10} /> Ethernet connected
              </p>
            )}
            <p className="mt-1 text-[10px] text-slate-500">
              {snapshot?.source === 'nmcli'
                ? 'Live scan via NetworkManager (nmcli)'
                : 'Simulated networks (install nmcli for real scan)'}
            </p>
          </div>

          <ul className="max-h-64 overflow-auto py-1">
            {isScanning && !snapshot?.networks.length ? (
              <li className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
                <Loader2 size={16} className="animate-spin" /> Scanning…
              </li>
            ) : (
              snapshot?.networks.map((net) => {
                const isActive = net.inUse || net.ssid === active;
                const securing = needsPassword(net.security);
                return (
                  <li key={net.ssid}>
                    <button
                      type="button"
                      disabled={isConnecting || isActive}
                      onClick={() => {
                        if (securing) {
                          setPasswordFor(net.ssid);
                          setPassword('');
                          return;
                        }
                        void connectTo(net.ssid);
                      }}
                      className={clsx(
                        'flex w-full items-center gap-3 px-4 py-2.5 text-left text-xs transition',
                        isActive ? 'bg-indigo-500/15' : 'hover:bg-white/5',
                        isConnecting && 'opacity-50',
                        passwordFor === net.ssid && 'bg-indigo-500/10 ring-1 ring-indigo-400/30'
                      )}
                    >
                      <Wifi
                        size={16}
                        className={clsx(
                          net.signal > 70
                            ? 'text-emerald-400'
                            : net.signal > 40
                              ? 'text-amber-400'
                              : 'text-slate-500'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-slate-200">
                            {net.ssid}
                          </span>
                          {isActive && (
                            <Check size={12} className="shrink-0 text-indigo-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {net.security} · {net.signal}%
                        </span>
                      </div>
                      <div className="flex h-4 w-8 items-end gap-0.5">
                        {[1, 2, 3, 4].map((bar) => (
                          <div
                            key={bar}
                            className={clsx(
                              'w-1 rounded-sm',
                              net.signal >= bar * 25
                                ? 'bg-emerald-500'
                                : 'bg-slate-700'
                            )}
                            style={{ height: `${bar * 3 + 2}px` }}
                          />
                        ))}
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {passwordFor && (
            <div className="border-t border-white/10 bg-indigo-500/10 px-4 py-3">
              <p className="mb-2 text-xs font-medium text-indigo-200">
                Password for “{passwordFor}”
              </p>
              <input
                type="password"
                value={password}
                placeholder="Network password"
                autoComplete="off"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && password) {
                    void connectTo(passwordFor, password);
                  }
                  if (e.key === 'Escape') {
                    setPasswordFor(null);
                    setPassword('');
                  }
                }}
                className="mb-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-[var(--accent)]"
              />
              <div className="flex justify-end gap-2">
                <Btn
                  onClick={() => {
                    setPasswordFor(null);
                    setPassword('');
                  }}
                >
                  Cancel
                </Btn>
                <Btn
                  variant="primary"
                  disabled={!password || isConnecting}
                  onClick={() => void connectTo(passwordFor, password)}
                >
                  {isConnecting ? 'Connecting…' : 'Connect'}
                </Btn>
              </div>
            </div>
          )}

          {lastError && !passwordFor && (
            <p className="border-t border-white/10 px-4 py-2 text-[10px] text-red-400">
              {lastError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
