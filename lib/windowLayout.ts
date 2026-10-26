/** Layout constants shared by window manager, dock, and desktop shell. */

export const MENUBAR_HEIGHT = 28;
export const DOCK_RESERVE = 96;
export const WINDOW_MARGIN = 12;

export function getDesktopAreaSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 720 - MENUBAR_HEIGHT - DOCK_RESERVE };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight - MENUBAR_HEIGHT - DOCK_RESERVE,
  };
}

/** Center a new window in the visible desktop area (above the dock). */
export function centeredWindowLayout(size: { width: number; height: number }): {
  position: { x: number; y: number };
  size: { width: number; height: number };
} {
  const area = getDesktopAreaSize();
  const width = Math.min(size.width, Math.max(320, area.width - WINDOW_MARGIN * 2));
  const height = Math.min(size.height, Math.max(200, area.height - WINDOW_MARGIN * 2));
  return {
    position: {
      x: Math.max(0, Math.round((area.width - width) / 2)),
      y: Math.max(0, Math.round((area.height - height) / 2)),
    },
    size: { width, height },
  };
}

/** Keep window fully above the dock within the window container. */
export function clampWindowPosition(
  pos: { x: number; y: number },
  size: { width: number; height: number },
  container: { width: number; height: number }
): { x: number; y: number } {
  const maxX = Math.max(0, container.width - size.width);
  const maxY = Math.max(0, container.height - size.height - DOCK_RESERVE);
  return {
    x: Math.min(Math.max(0, pos.x), maxX),
    y: Math.min(Math.max(0, pos.y), maxY),
  };
}

export function clampWindowSize(
  size: { width: number; height: number },
  container: { width: number; height: number }
): { width: number; height: number } {
  const maxW = container.width - WINDOW_MARGIN * 2;
  const maxH = container.height - DOCK_RESERVE - WINDOW_MARGIN;
  return {
    width: Math.min(Math.max(320, size.width), maxW),
    height: Math.min(Math.max(200, size.height), maxH),
  };
}
