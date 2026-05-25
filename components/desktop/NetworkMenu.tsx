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
          'os-interactive os-focus-ring flex items-center gap-1.5 rounded-md px-2 py-1',
          open
            ? 'bg-white/15 text-[var(--text-primary)]'
            : 'text-[var(--text-muted)] hover:bg-white/[0.08] hover:text-[var(--text-primary)]'
        )}
        title="Wi-Fi networks"
      >
        {signalIcon ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span className="max-w-[100px] truncate text-[10px]">
          {active || 'Wi-Fi'}
        </span>
      </button>

      {open && (
        <div className="os-glass-popover absolute right-0 top-full z-[200] mt-2 w-80 overflow-hidden rounded-xl">
          <div className="border-b border-[var(--separator)] px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
                Wi-Fi
              </h3>
              <button
                type="button"
                onClick={() => scan()}
                disabled={isScanning}
                className="mac-icon-btn"
              >
                <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
              </button>
            </div>
            {snapshot?.ethernetConnected && (
              <p className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                <Cable size={10} /> Ethernet connected
              </p>
            )}
            <p className="mt-1 text-[10px] text-[var(--text-subtle)]">
              {snapshot?.source === 'nmcli'
                ? 'Live scan via NetworkManager (nmcli)'
                : 'Simulated networks (install nmcli for real scan)'}
            </p>
          </div>

          <ul className="max-h-64 overflow-auto py-1">
            {isScanning && !snapshot?.networks.length ? (
              <li className="flex items-center justify-center gap-2 py-6 text-[12px] text-[var(--text-muted)]">
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
                        'mac-list-item rounded-none px-4',
                        isActive && 'mac-list-item-active',
                        isConnecting && 'opacity-50',
                        passwordFor === net.ssid && 'ring-1 ring-[var(--accent)]/40'
                      )}
                    >
                      <Wifi
                        size={16}
                        className={clsx(
                          net.signal > 70
                            ? 'text-emerald-400'
                            : net.signal > 40
                              ? 'text-amber-400'
                              : 'text-[var(--text-subtle)]'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{net.ssid}</span>
                          {isActive && (
                            <Check size={12} className="shrink-0 text-[var(--accent)]" />
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)]">
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
                                : 'bg-white/15'
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
            <div className="border-t border-[var(--separator)] bg-[var(--accent)]/10 px-4 py-3">
              <p className="mb-2 text-[12px] font-medium text-[var(--text-primary)]">
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
                className="mac-field mb-2"
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
            <p className="border-t border-[var(--separator)] px-4 py-2 text-[10px] text-red-400">
              {lastError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
