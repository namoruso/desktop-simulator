import { get, set } from 'idb-keyval';
import type { SchedulerAlgorithm } from '@/types/process.types';

export const persistence = {
  saveTerminalHistory: (history: string[]) =>
    set('terminal-history', history),

  loadTerminalHistory: (): Promise<string[]> =>
    get<string[]>('terminal-history').then((h) => h ?? []),

  saveEditorFile: (name: string, content: string) =>
    set(`editor-file-${name}`, content),

  loadEditorFile: (name: string): Promise<string> =>
    get<string>(`editor-file-${name}`).then((c) => c ?? ''),

  saveSchedulerConfig: (config: {
    algorithm: SchedulerAlgorithm;
    quantumMs: number;
  }) => set('scheduler-config', config),

  loadSchedulerConfig: (): Promise<{
    algorithm: SchedulerAlgorithm;
    quantumMs: number;
  } | undefined> => get('scheduler-config'),
};
