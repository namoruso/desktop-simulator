'use client';

import { useState } from 'react';
import type { BlockType } from '@/types/memory.types';
import { useMemoryStore } from '@/store/useMemoryStore';

const BLOCK_COLORS: Record<BlockType, string> = {
  free: '#1e3a2f',
  cached: '#3b4d6b',
  system: '#1e3a5f',
  user: '#6366f1',
  simulator: '#a855f7',
  leaked: '#ef4444',
};

const LEGEND: { type: BlockType; label: string; hint: string }[] = [
  { type: 'user', label: 'Applications', hint: 'Real processes (RSS sum)' },
  { type: 'simulator', label: 'WebOS', hint: 'Simulator + open windows' },
  { type: 'cached', label: 'Cache', hint: 'Disk cache (reclaimable)' },
  { type: 'system', label: 'Kernel', hint: 'OS core' },
  { type: 'free', label: 'Available', hint: 'RAM available for apps' },
  { type: 'leaked', label: 'Leak', hint: 'Simulated memory leak' },
];

function countByType(blocks: { type: BlockType }[], type: BlockType) {
  return blocks.filter((b) => b.type === type).length;
}

export function MemoryMapView() {
  const memoryMap = useMemoryStore((s) => s.memoryMap);
  const simulateMemoryLeak = useMemoryStore((s) => s.simulateMemoryLeak);
  const [hover, setHover] = useState<string | null>(null);

  const topUser = memoryMap.blocks.find((b) => b.type === 'user' && b.pid);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-black/25 p-3 text-xs leading-relaxed text-slate-400">
        <p className="font-medium text-slate-200">What is this grid?</p>
        <p className="mt-1">
          Each square = 1% of your RAM ({Math.round(memoryMap.totalMB / 100)} MB).
          Colors show how memory is distributed: real apps, WebOS overhead, cache,
          and free space. This is a visual model — not a byte-perfect map.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Physical RAM" value={`${memoryMap.physicalTotalMB || memoryMap.totalMB} MB`} />
        <Stat label="Apps (RSS)" value={`${memoryMap.appsUsedMB} MB`} />
        <Stat label="WebOS sim." value={`${memoryMap.simUsedMB} MB`} />
        <Stat label="Available" value={`${memoryMap.availableMB} MB`} />
        <Stat label="Swap" value={`${memoryMap.swapUsedMB} / ${memoryMap.swapTotalMB} MB`} />
        <Stat
          label="Host pressure"
          value={`${memoryMap.hostUsedPercent}%`}
          hint="total − available"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>
          Display: {memoryMap.displayUsedMB} / {memoryMap.totalMB} MB (
          {memoryMap.displayUsedPercent}% apps + simulator)
        </span>
        {topUser?.pid && (
          <button
            type="button"
            className="rounded bg-red-600/60 px-2 py-1 text-[10px] text-white"
            onClick={() => simulateMemoryLeak(topUser.pid!, 1)}
          >
            Simulate leak
          </button>
        )}
      </div>

      {hover && (
        <p className="rounded bg-white/5 px-2 py-1 text-center text-[11px] text-indigo-200">
          {hover}
        </p>
      )}

      <div
        className="grid gap-1 rounded-lg border border-white/10 bg-black/20 p-2"
        style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}
      >
        {memoryMap.blocks.map((block) => {
          const pct = ((block.sizeMB / memoryMap.totalMB) * 100).toFixed(1);
          const tip = block.processName
            ? `${block.processName} · ~${block.sizeMB.toFixed(0)} MB (${pct}%)`
            : `Available · ~${block.sizeMB.toFixed(0)} MB`;
          return (
            <div
              key={block.index}
              className="aspect-square rounded-sm ring-1 ring-black/20 transition hover:ring-white/40"
              style={{ backgroundColor: BLOCK_COLORS[block.type] }}
              onMouseEnter={() => setHover(tip)}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {LEGEND.map(({ type, label, hint }) => {
          const n = countByType(memoryMap.blocks, type);
          if (n === 0 && type === 'leaked') return null;
          return (
            <div
              key={type}
              className="flex items-start gap-2 rounded-lg border border-white/5 bg-black/20 px-2 py-1.5"
            >
              <span
                className="mt-0.5 h-4 w-4 shrink-0 rounded"
                style={{ backgroundColor: BLOCK_COLORS[type] }}
              />
              <div>
                <span className="text-[11px] font-medium text-slate-200">
                  {label}{' '}
                  <span className="text-slate-500">({n} blocks = {n}%)</span>
                </span>
                <p className="text-[10px] text-slate-500">{hint}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="font-medium text-slate-200">{value}</div>
      {hint && <div className="text-[9px] text-slate-600">{hint}</div>}
    </div>
  );
}
