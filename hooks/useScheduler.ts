'use client';

import { useEffect, useRef } from 'react';
import { useProcessStore } from '@/store/useProcessStore';

export function useScheduler() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const scheduler = useProcessStore((s) => s.scheduler);
  const tickScheduler = useProcessStore((s) => s.tickScheduler);

  useEffect(() => {
    if (!scheduler.isRunning || scheduler.isPaused) {
      clearInterval(intervalRef.current);
      return;
    }

    const effectiveQuantum = Math.max(
      10,
      scheduler.quantumMs / scheduler.speedMultiplier
    );

    intervalRef.current = setInterval(() => {
      tickScheduler();
    }, effectiveQuantum);

    return () => clearInterval(intervalRef.current);
  }, [
    scheduler.isRunning,
    scheduler.isPaused,
    scheduler.quantumMs,
    scheduler.speedMultiplier,
    tickScheduler,
  ]);
}
