'use client';

import { useState } from 'react';
import { ProcessList } from './ProcessList';
import { CpuGraph } from './CpuGraph';
import { MemoryMapView } from './MemoryMap';
import { SchedulerControls } from './SchedulerControls';

type Tab = 'processes' | 'performance' | 'memory' | 'scheduler';

export function TaskManager() {
  const [tab, setTab] = useState<Tab>('processes');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'processes', label: 'Processes' },
    { id: 'performance', label: 'Performance' },
    { id: 'memory', label: 'Memory' },
    { id: 'scheduler', label: 'Scheduler' },
  ];

  return (
    <div className="flex h-full flex-col bg-[var(--app-bg)] text-sm">
      <nav className="flex gap-1 border-b border-white/10 bg-black/20 px-2 pt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-4 py-2 text-xs font-medium transition ${
              tab === t.id
                ? 'bg-[var(--accent)]/20 text-white ring-1 ring-[var(--accent)]/40'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-auto p-3">
        {tab === 'processes' && <ProcessList />}
        {tab === 'performance' && <CpuGraph />}
        {tab === 'memory' && <MemoryMapView />}
        {tab === 'scheduler' && <SchedulerControls />}
      </div>
    </div>
  );
}
