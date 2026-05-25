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
    <nav className="mac-segmented">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={clsx('mac-tab', active === t.id && 'mac-tab-active')}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
