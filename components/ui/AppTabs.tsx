'use client';

import clsx from 'clsx';

export function AppTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <nav className="flex gap-1 border-b border-white/10 bg-black/20 px-2 pt-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={clsx(
            'rounded-t-lg px-4 py-2 text-xs font-medium transition',
            active === t.id
              ? 'bg-[var(--accent)]/20 text-white ring-1 ring-[var(--accent)]/40'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          )}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
