'use client';

import { useBootSequence } from '@/hooks/useBootSequence';
import { useOSStore } from '@/store/useOSStore';
import { BootScreen } from '@/components/boot/BootScreen';
import { ShutdownScreen } from '@/components/boot/ShutdownScreen';
import { RestartScreen } from '@/components/boot/RestartScreen';
import { PowerScreen } from '@/components/boot/PowerScreen';
import { Desktop } from '@/components/desktop/Desktop';

export function OSController() {
  const osState = useOSStore((s) => s.osState);
  useBootSequence();

  switch (osState) {
    case 'booting':
      return <BootScreen />;
    case 'shuttingdown':
      return <ShutdownScreen />;
    case 'restarting':
      return <RestartScreen />;
    case 'running':
    case 'sleeping':
      return <Desktop />;
    case 'off':
    default:
      return <PowerScreen />;
  }
}
