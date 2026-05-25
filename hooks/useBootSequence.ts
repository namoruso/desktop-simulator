'use client';

import { useEffect } from 'react';
import { useOSStore } from '@/store/useOSStore';
import { useProcessStore } from '@/store/useProcessStore';

export function useBootSequence() {
  const osState = useOSStore((s) => s.osState);

  useEffect(() => {
    if (osState === 'booting') {
      const timer = setTimeout(() => {
        useOSStore.getState().wake();
        useProcessStore.setState((s) => ({
          scheduler: { ...s.scheduler, isRunning: true, isPaused: false },
        }));
      }, 4000);
      return () => clearTimeout(timer);
    }

    if (osState === 'shuttingdown') {
      useProcessStore.setState((s) => ({
        scheduler: { ...s.scheduler, isRunning: false },
      }));
      const timer = setTimeout(() => {
        useOSStore.setState({ osState: 'off', bootTimestamp: null });
      }, 3000);
      return () => clearTimeout(timer);
    }

    if (osState === 'restarting') {
      useProcessStore.setState((s) => ({
        scheduler: { ...s.scheduler, isRunning: false, isPaused: false },
      }));
      const timer = setTimeout(() => {
        useOSStore.getState().boot();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [osState]);
}
