'use client';

import { useState } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import { AppTabs } from '@/components/ui/AppTabs';
import { ProcessList } from './ProcessList';
import { CpuGraph } from './CpuGraph';
import { MemoryMapView } from './MemoryMap';
import { SchedulerControls } from './SchedulerControls';
import { IOLogView } from './IOLogView';

type Tab = 'processes' | 'performance' | 'memory' | 'scheduler' | 'io';

export function TaskManager() {
  const [tab, setTab] = useState<Tab>('processes');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'processes', label: 'Processes' },
    { id: 'performance', label: 'Performance' },
    { id: 'memory', label: 'Memory' },
    { id: 'scheduler', label: 'Scheduler' },
    { id: 'io', label: 'I/O Log' },
  ];

  return (
    <AppShell>
      <AppTabs tabs={tabs} active={tab} onChange={setTab} />
      <div className="flex-1 overflow-auto p-3">
        {tab === 'processes' && <ProcessList />}
        {tab === 'performance' && <CpuGraph />}
        {tab === 'memory' && <MemoryMapView />}
        {tab === 'scheduler' && <SchedulerControls />}
        {tab === 'io' && <IOLogView />}
      </div>
    </AppShell>
  );
}
