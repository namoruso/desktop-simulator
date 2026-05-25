'use client';

import { useEffect } from 'react';
import { useOSStore } from '@/store/useOSStore';
import { useProcessStore } from '@/store/useProcessStore';
import { useSettingsStore } from '@/store/useSettingsStore';

/** Ensures scheduler and settings stay coherent across boot, reload, and restart. */
export function useOSLifecycle() {
  const osState = useOSStore((s) => s.osState);

  useEffect(() => {
    if (osState !== 'running' && osState !== 'sleeping') return;

    const sched = useProcessStore.getState().scheduler;
    if (!sched.isRunning) {
      useProcessStore.setState((s) => ({
        scheduler: { ...s.scheduler, isRunning: true },
      }));
    }
  }, [osState]);

  useEffect(() => {
    const { schedulerAlgorithm, quantumMs } = useSettingsStore.getState();
    const proc = useProcessStore.getState();
    proc.setSchedulerAlgorithm(schedulerAlgorithm);
    proc.setQuantum(quantumMs);
  }, []);
}
