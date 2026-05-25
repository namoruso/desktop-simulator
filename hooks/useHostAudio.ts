'use client';

import { useEffect, useCallback } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

export function useHostAudio() {
  const setVolume = useSettingsStore((s) => s.setVolume);
  const volume = useSettingsStore((s) => s.volume);

  const syncFromHost = useCallback(async () => {
    try {
      const res = await fetch('/api/audio', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.volume === 'number' && data.backend !== 'none') {
        setVolume(data.volume);
      }
    } catch {
      /* host audio unavailable */
    }
  }, [setVolume]);

  const applyVolume = useCallback(
    async (v: number) => {
      setVolume(v);
      try {
        const res = await fetch('/api/audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ volume: v }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.volume === 'number') setVolume(data.volume);
        }
      } catch {
        /* fallback: local setting only */
      }
    },
    [setVolume]
  );

  useEffect(() => {
    void syncFromHost();
    const id = setInterval(syncFromHost, 15000);
    return () => clearInterval(id);
  }, [syncFromHost]);

  return { volume, applyVolume, syncFromHost };
}
