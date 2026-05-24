'use client';

import { useEffect, useState } from 'react';
import { useOSStore } from '@/store/useOSStore';
import { useWindowStore } from '@/store/useWindowStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useNetworkStore } from '@/store/useNetworkStore';

export function StoreHydrator({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rehydrate = async () => {
      await Promise.all([
        useOSStore.persist.rehydrate(),
        useWindowStore.persist.rehydrate(),
        useSettingsStore.persist.rehydrate(),
        useNetworkStore.persist.rehydrate(),
      ]);
      setReady(true);
    };
    rehydrate();
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#0a0a0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-slate-500">Loading WebOS…</p>
      </div>
    );
  }

  return <>{children}</>;
}
