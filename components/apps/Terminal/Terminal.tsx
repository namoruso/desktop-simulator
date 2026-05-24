'use client';

import { useEffect, useState } from 'react';
import { useOSStore } from '@/store/useOSStore';
import { useProcessStore } from '@/store/useProcessStore';
import { useMemoryStore } from '@/store/useMemoryStore';
import { persistence } from '@/hooks/usePersistence';

export function Terminal() {
  const [history, setHistory] = useState<string[]>([
    'WebOS Terminal v1.0 — type "help" for commands',
  ]);
  const [input, setInput] = useState('');
  const uptimeSeconds = useOSStore((s) => s.uptimeSeconds);
  const processes = useProcessStore((s) => s.processes);
  const killProcess = useProcessStore((s) => s.killProcess);
  const memoryMap = useMemoryStore((s) => s.memoryMap);
  const scheduler = useProcessStore((s) => s.scheduler);

  useEffect(() => {
    persistence.loadTerminalHistory().then((h) => {
      if (h.length) setHistory(h);
    });
  }, []);

  const append = (lines: string[]) => {
    setHistory((h) => {
      const next = [...h, ...lines];
      persistence.saveTerminalHistory(next.slice(-200));
      return next;
    });
  };

  const runCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    append([`$ ${trimmed}`]);
    const [name, arg] = trimmed.split(/\s+/, 2);

    switch (name.toLowerCase()) {
      case 'help':
        append([
          'Commands: ps, top, kill <pid>, free, uptime, clear, help',
        ]);
        break;
      case 'clear':
        setHistory([]);
        persistence.saveTerminalHistory([]);
        break;
      case 'ps': {
        const list = [...processes.values()]
          .filter((p) => p.state !== 'terminated')
          .slice(0, 20)
          .map(
            (p) =>
              `${p.pid.toString().padStart(6)} ${p.state.padEnd(10)} ${p.cpuUsage.toFixed(1).padStart(5)}% ${p.memoryMB}MB ${p.name}`
          );
        append(list.length ? list : ['(no processes)']);
        break;
      }
      case 'top':
        append([
          `CPU scheduler: ${scheduler.algorithm} @ ${scheduler.quantumMs}ms`,
          `Current PID: ${scheduler.currentPid ?? 'none'}`,
          `Ready queue: ${scheduler.readyQueue.length} processes`,
        ]);
        break;
      case 'kill': {
        const pid = parseInt(arg, 10);
        if (isNaN(pid)) {
          append(['Usage: kill <pid>']);
        } else {
          killProcess(pid);
          append([`Sent SIGTERM to PID ${pid} (simulated)`]);
        }
        break;
      }
      case 'free':
        append([
          `              total        used        free`,
          `Mem:  total ${memoryMap.totalMB} MB  apps ${memoryMap.appsUsedMB} MB  webos ${memoryMap.simUsedMB} MB  avail ${memoryMap.availableMB} MB`,
          `Swap:      ${memoryMap.swapTotalMB} MB    ${memoryMap.swapUsedMB} MB`,
        ]);
        break;
      case 'uptime':
        append([`up ${uptimeSeconds} seconds`]);
        break;
      default:
        append([`command not found: ${name}`]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runCommand(input);
    setInput('');
  };

  return (
    <div className="flex h-full flex-col bg-black/80 font-mono text-sm text-green-400">
      <div className="flex-1 overflow-auto p-3">
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap text-green-300/90">
            {line}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex border-t border-green-900/50 p-2">
        <span className="mr-2 text-green-500">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent text-green-100 outline-none caret-green-400"
          autoFocus
          spellCheck={false}
        />
      </form>
    </div>
  );
}
