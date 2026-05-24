'use client';

import { useRef } from 'react';
import { useWindowStore } from '@/store/useWindowStore';
import { Window } from './Window';

export function WindowManager() {
  const containerRef = useRef<HTMLDivElement>(null);
  const windows = useWindowStore((s) => s.windows);
  const sorted = [...windows].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {sorted.map((win) => (
        <div key={win.id} className="pointer-events-auto">
          <Window window={win} containerRef={containerRef} />
        </div>
      ))}
    </div>
  );
}
