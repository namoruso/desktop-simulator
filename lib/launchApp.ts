import type { AppType } from '@/types/window.types';
import { useWindowStore } from '@/store/useWindowStore';

/** Open app or focus / restore existing window. */
export function launchApp(appType: AppType, forceNew = false) {
  const { windows, openWindow, focusWindow, restoreWindow } =
    useWindowStore.getState();

  if (!forceNew) {
    const existing = windows.find((w) => w.appType === appType);
    if (existing) {
      if (existing.isMinimized) {
        restoreWindow(existing.id);
      } else {
        focusWindow(existing.id);
      }
      return existing.id;
    }
  }

  return openWindow(appType);
}
