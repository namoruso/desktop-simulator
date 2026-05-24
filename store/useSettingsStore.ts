import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SchedulerAlgorithm } from '@/types/process.types';

export type WallpaperStyle = 'aurora' | 'mountains' | 'solid' | 'gradient';
export type UiScale = 'compact' | 'comfortable' | 'large';
export type TimeFormat = '12h' | '24h';

interface SettingsStore {
  accentColor: string;
  wallpaper: WallpaperStyle;
  uiScale: UiScale;
  timeFormat: TimeFormat;
  showDesktopIcons: boolean;
  showDockLabels: boolean;
  reduceMotion: boolean;
  schedulerAlgorithm: SchedulerAlgorithm;
  quantumMs: number;
  volume: number;
  notificationsEnabled: boolean;
  nightMode: boolean;
  language: string;
  setAccentColor: (c: string) => void;
  setWallpaper: (w: WallpaperStyle) => void;
  setUiScale: (s: UiScale) => void;
  setTimeFormat: (t: TimeFormat) => void;
  setShowDesktopIcons: (v: boolean) => void;
  setShowDockLabels: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setSchedulerAlgorithm: (a: SchedulerAlgorithm) => void;
  setQuantumMs: (ms: number) => void;
  setVolume: (v: number) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setNightMode: (v: boolean) => void;
  setLanguage: (l: string) => void;
  resetAll: () => void;
}

const defaults = {
  accentColor: '#6366f1',
  wallpaper: 'aurora' as WallpaperStyle,
  uiScale: 'comfortable' as UiScale,
  timeFormat: '24h' as TimeFormat,
  showDesktopIcons: true,
  showDockLabels: false,
  reduceMotion: false,
  schedulerAlgorithm: 'RR' as SchedulerAlgorithm,
  quantumMs: 100,
  volume: 70,
  notificationsEnabled: true,
  nightMode: true,
  language: 'en',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaults,
      setAccentColor: (accentColor) => set({ accentColor }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setUiScale: (uiScale) => set({ uiScale }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
      setShowDesktopIcons: (showDesktopIcons) => set({ showDesktopIcons }),
      setShowDockLabels: (showDockLabels) => set({ showDockLabels }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setSchedulerAlgorithm: (schedulerAlgorithm) =>
        set({ schedulerAlgorithm }),
      setQuantumMs: (quantumMs) => set({ quantumMs }),
      setVolume: (volume) => set({ volume }),
      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),
      setNightMode: (nightMode) => set({ nightMode }),
      setLanguage: (language) => set({ language }),
      resetAll: () => set(defaults),
    }),
    {
      name: 'webos-settings-v2',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
