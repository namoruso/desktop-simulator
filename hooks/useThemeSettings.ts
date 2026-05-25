'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

export function useThemeSettings() {
  const accent = useSettingsStore((s) => s.accentColor);
  const nightMode = useSettingsStore((s) => s.nightMode);
  const uiScale = useSettingsStore((s) => s.uiScale);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const language = useSettingsStore((s) => s.language);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    root.style.setProperty(
      '--accent-hover',
      `color-mix(in srgb, ${accent} 75%, white)`
    );
    root.style.setProperty('--accent-glow', `${accent}66`);
    root.classList.toggle('night-mode', nightMode);
    root.classList.toggle('reduce-motion', reduceMotion);
    root.dataset.uiScale = uiScale;
    root.lang = language === 'es' ? 'es' : 'en';
  }, [accent, nightMode, uiScale, reduceMotion, language]);
}
