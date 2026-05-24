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
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f57] transition hover:brightness-110"
      >
        <span className="text-[8px] font-bold text-red-950 opacity-0 group-hover:opacity-100">
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
        className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#febc2e] transition hover:brightness-110"
      >
        <span className="text-[8px] font-bold text-amber-950 opacity-0 group-hover:opacity-100">
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
        className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#28c840] transition hover:brightness-110"
      >
        <span className="text-[8px] font-bold text-green-950 opacity-0 group-hover:opacity-100">
          +
        </span>
      </button>
    </div>
  );
}
