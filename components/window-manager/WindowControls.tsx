'use client';

interface WindowControlsProps {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}

export function WindowControls({
  onClose,
  onMinimize,
  onMaximize,
}: WindowControlsProps) {
  return (
    <div className="flex items-center gap-2 pl-0.5">
      <button
        type="button"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="group flex h-3 w-3 items-center justify-center rounded-full bg-[var(--mac-red)] transition hover:brightness-95"
      >
        <span className="text-[9px] font-bold leading-none text-red-950/0 transition group-hover:text-red-950/80">
          ×
        </span>
      </button>
      <button
        type="button"
        aria-label="Minimize"
        onClick={(e) => {
          e.stopPropagation();
          onMinimize();
        }}
        className="group flex h-3 w-3 items-center justify-center rounded-full bg-[var(--mac-yellow)] transition hover:brightness-95"
      >
        <span className="text-[9px] font-bold leading-none text-amber-950/0 transition group-hover:text-amber-950/80">
          −
        </span>
      </button>
      <button
        type="button"
        aria-label="Maximize"
        onClick={(e) => {
          e.stopPropagation();
          onMaximize();
        }}
        className="group flex h-3 w-3 items-center justify-center rounded-full bg-[var(--mac-green)] transition hover:brightness-95"
      >
        <span className="text-[9px] font-bold leading-none text-green-950/0 transition group-hover:text-green-950/80">
          +
        </span>
      </button>
    </div>
  );
}
