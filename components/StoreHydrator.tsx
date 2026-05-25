'use client';

import { useEffect, useState } from 'react';
import { useOSStore } from '@/store/useOSStore';
import { useWindowStore } from '@/store/useWindowStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { useEditorStore } from '@/store/useEditorStore';

const HYDRATE_TIMEOUT_MS = 8000;

export function StoreHydrator({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (!cancelled) setReady(true);
    };

    const timeout = setTimeout(finish, HYDRATE_TIMEOUT_MS);

    const rehydrate = async () => {
      try {
        await Promise.allSettled([
          useOSStore.persist.rehydrate(),
          useWindowStore.persist.rehydrate(),
          useSettingsStore.persist.rehydrate(),
          useNetworkStore.persist.rehydrate(),
          useEditorStore.persist.rehydrate(),
        ]);
      } finally {
        clearTimeout(timeout);
        finish();
      }
    };

    void rehydrate();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: '#0a0a0f',
          color: '#94a3b8',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: '2px solid #6366f1',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'webos-spin 0.8s linear infinite',
          }}
        />
        <p style={{ margin: 0, fontSize: 14 }}>Loading WebOS…</p>
        <style>{`@keyframes webos-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
