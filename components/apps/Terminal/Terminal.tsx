'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useOSStore } from '@/store/useOSStore';
import { useProcessStore } from '@/store/useProcessStore';
import { useMemoryStore } from '@/store/useMemoryStore';
import { persistence } from '@/hooks/usePersistence';
import { AppShell } from '@/components/ui/AppShell';
import { APP_VERSION } from '@/lib/constants';
import { resolveTerminalPath } from '@/lib/terminalPath';
import { parseCurlUrl } from '@/lib/curlUrl';
import { asciiLiveAnimation } from '@/lib/asciiLive';
import { RICK_FRAMES, RICK_FRAME_MS } from '@/lib/asciiRickFrames';
import { latestAsciiFrame } from '@/lib/terminalAnsi';
import { notifyFileIoComplete } from '@/lib/fileIoNotify';

const CURL_CONNECT_MS = 8_000;

export function Terminal() {
  const [history, setHistory] = useState<string[]>([
    `WebOS Terminal v${APP_VERSION} — type "help" for commands`,
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [cwd, setCwd] = useState<string | null>(null);
  const [streamLine, setStreamLine] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const animIntervalRef = useRef<number | null>(null);
  const streamStoppedRef = useRef(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const uptimeSeconds = useOSStore((s) => s.uptimeSeconds);
  const processes = useProcessStore((s) => s.processes);
  const killProcess = useProcessStore((s) => s.killProcess);
  const suspendProcess = useProcessStore((s) => s.suspendProcess);
  const resumeProcess = useProcessStore((s) => s.resumeProcess);
  const memoryMap = useMemoryStore((s) => s.memoryMap);
  const scheduler = useProcessStore((s) => s.scheduler);

  useEffect(() => {
    persistence.loadTerminalHistory().then((h) => {
      if (h.length) setHistory(h);
    });
    fetch('/api/storage')
      .then((r) => r.json())
      .then((s) => {
        const home = s.userHome ?? s.drives?.find((d: { type: string }) => d.type === 'home')?.mount;
        if (home) setCwd(home);
      })
      .catch(() => {});
  }, []);

  const append = (lines: string[]) => {
    setHistory((h) => {
      const next = [...h, ...lines];
      persistence.saveTerminalHistory(next.slice(-200));
      return next;
    });
  };

  const stopActiveStream = useCallback(() => {
    if (!abortRef.current && animIntervalRef.current === null) {
      return;
    }
    streamStoppedRef.current = true;

    if (animIntervalRef.current !== null) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreamLine(null);
    append(['^C']);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'c') return;
      if (!abortRef.current && animIntervalRef.current === null) return;
      e.preventDefault();
      e.stopPropagation();
      stopActiveStream();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [stopActiveStream]);

  useEffect(() => {
    if (streamLine && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamLine]);

  const listDir = async (dir: string) => {
    const res = await fetch(`/api/files?path=${encodeURIComponent(dir)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.entries as { name: string; isDirectory: boolean }[];
  };

  const fileAction = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Operation failed');
    notifyFileIoComplete();
    return data as { ok: boolean; path?: string };
  };

  const requireCwd = (): string | null => {
    if (!cwd) {
      append(['Home directory not loaded yet — wait a moment and retry']);
      return null;
    }
    return cwd;
  };

  const parseCurlArgs = (tokens: string[]): string | null => {
    let url = '';
    for (let i = 1; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.startsWith('-')) continue;
      url = t;
    }
    return url || null;
  };

  const fetchWithConnectTimeout = async (
    url: string,
    signal: AbortSignal
  ): Promise<Response> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('Connection timed out (8s)')),
        CURL_CONNECT_MS
      );
    });
    try {
      return await Promise.race([
        fetch(url, { signal, cache: 'no-store' }),
        timeout,
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  const streamAsciiResponse = async (
    res: Response,
    controller: AbortController
  ) => {
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    if (!res.body) {
      const text = await res.text();
      setStreamLine(null);
      append(text ? text.split('\n') : ['(empty response)']);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (!controller.signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      setStreamLine(latestAsciiFrame(buffer));
    }
  };

  const runBundledRick = async (controller: AbortController) => {
    append(['Rick Roll ASCII animation — Ctrl+C to stop']);
    let frame = 0;
    setStreamLine(RICK_FRAMES[0] ?? '');

    await new Promise<void>((resolve) => {
      const finish = () => {
        if (animIntervalRef.current !== null) {
          clearInterval(animIntervalRef.current);
          animIntervalRef.current = null;
        }
        resolve();
      };

      animIntervalRef.current = window.setInterval(() => {
        if (streamStoppedRef.current || controller.signal.aborted) {
          finish();
          return;
        }
        frame = (frame + 1) % RICK_FRAMES.length;
        setStreamLine(RICK_FRAMES[frame]);
      }, RICK_FRAME_MS);

      controller.signal.addEventListener('abort', finish, { once: true });
    });
  };

  const runAsciiLive = async (name: string, controller: AbortController) => {
    if (name === 'rick') {
      await runBundledRick(controller);
      return;
    }

    setStreamLine('Connecting…');
    const res = await fetchWithConnectTimeout(
      `/api/terminal/ascii/${encodeURIComponent(name)}`,
      controller.signal
    );
    await streamAsciiResponse(res, controller);
    if (!controller.signal.aborted) {
      append(['(curl ended — Ctrl+C to stop earlier)']);
    }
  };

  const runCurl = async (urlArg: string) => {
    let parsed: URL;
    try {
      parsed = parseCurlUrl(urlArg);
    } catch (e) {
      append([e instanceof Error ? e.message : 'Invalid URL']);
      return;
    }

    const animName = asciiLiveAnimation(parsed);

    if (abortRef.current || animIntervalRef.current !== null) {
      stopActiveStream();
    }
    streamStoppedRef.current = false;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (animName) {
        await runAsciiLive(animName, controller);
        if (streamStoppedRef.current) return;
        return;
      }

      setStreamLine('Connecting…');
      const res = await fetchWithConnectTimeout(
        `/api/terminal/curl?url=${encodeURIComponent(parsed.toString())}`,
        controller.signal
      );
      await streamAsciiResponse(res, controller);
      if (!controller.signal.aborted) {
        setStreamLine(null);
        append(['(curl ended)']);
      }
    } catch (e) {
      if (streamStoppedRef.current) return;
      setStreamLine(null);
      if (e instanceof Error && e.name === 'AbortError') {
        stopActiveStream();
        return;
      }
      append([e instanceof Error ? e.message : 'curl failed']);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      if (animIntervalRef.current !== null) {
        clearInterval(animIntervalRef.current);
        animIntervalRef.current = null;
      }
      if (!streamStoppedRef.current && !controller.signal.aborted) {
        setStreamLine(null);
      }
    }
  };

  const runCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setCmdHistory((h) => [...h.filter((c) => c !== trimmed), trimmed].slice(-50));
    setHistoryIdx(-1);

    append([`${cwd ? cwd : '~'}$ ${trimmed}`]);
    const parts = trimmed.split(/\s+/);
    const name = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (name) {
      case 'help':
        append([
          'Files:  ls [path], cd <path>, pwd, cat <file>',
          '        mkdir <dir> | mkdir -p <path>, touch <file>',
          '        rm <file> | rm -r <dir>',
          'Net:    curl <url>   e.g. curl ascii.live/rick  (Ctrl+C to stop)',
          'System: ps, top, free, uptime, kill/suspend/resume <pid>',
          '        clear, help',
        ]);
        break;
      case 'clear':
        setHistory([]);
        persistence.saveTerminalHistory([]);
        break;
      case 'pwd':
        append([cwd ?? '(home not loaded)']);
        break;
      case 'cd': {
        if (!arg) {
          append(['Usage: cd <path>']);
          break;
        }
        try {
          const target = arg.startsWith('/') ? arg : `${cwd}/${arg}`;
          const res = await fetch(
            `/api/files?path=${encodeURIComponent(target)}`
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setCwd(data.path);
          append([`cd ${data.path}`]);
        } catch (e) {
          append([e instanceof Error ? e.message : 'cd failed']);
        }
        break;
      }
      case 'ls': {
        const target = arg
          ? arg.startsWith('/')
            ? arg
            : `${cwd}/${arg}`
          : cwd;
        if (!target) {
          append(['No working directory']);
          break;
        }
        try {
          const entries = await listDir(target);
          const lines = entries.map((e) =>
            e.isDirectory ? `${e.name}/` : e.name
          );
          append(lines.length ? lines : ['(empty)']);
        } catch (e) {
          append([e instanceof Error ? e.message : 'ls failed']);
        }
        break;
      }
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
        const parts = trimmed.split(/\s+/);
        const host = parts[1] === '--host';
        const sig9 = parts[1] === '-9' || parts[1] === '-KILL';
        const pidStr = host ? parts[2] : sig9 ? parts[2] : parts[1];
        const pid = parseInt(pidStr ?? '', 10);
        if (isNaN(pid)) {
          append(['Usage: kill <pid> | kill -9 <pid> | kill --host <pid>']);
          break;
        }
        if (host) {
          void killProcess(pid, 'host').then(() =>
            append([`SIGTERM sent to PID ${pid} (host)`])
          );
        } else if (sig9) {
          void fetch('/api/process/kill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pid, signal: 'SIGKILL' }),
          }).then(async (res) => {
            const data = await res.json();
            append([
              res.ok
                ? `SIGKILL sent to PID ${pid}`
                : data.error || 'kill failed',
            ]);
            killProcess(pid, 'simulation');
          });
        } else {
          void killProcess(pid, 'simulation');
          append([`PID ${pid} marked terminated (simulation)`]);
        }
        break;
      }
      case 'suspend': {
        const pid = parseInt(arg, 10);
        if (isNaN(pid)) append(['Usage: suspend <pid>']);
        else {
          suspendProcess(pid);
          append([`PID ${pid} suspended in scheduler simulation`]);
        }
        break;
      }
      case 'resume': {
        const pid = parseInt(arg, 10);
        if (isNaN(pid)) append(['Usage: resume <pid>']);
        else {
          resumeProcess(pid);
          append([`PID ${pid} resumed (ready)`]);
        }
        break;
      }
      case 'free':
        append([
          `Mem:  total ${memoryMap.totalMB} MB  apps ${memoryMap.appsUsedMB} MB  webos ${memoryMap.simUsedMB} MB  avail ${memoryMap.availableMB} MB`,
          `Swap: ${memoryMap.swapUsedMB} / ${memoryMap.swapTotalMB} MB`,
        ]);
        break;
      case 'uptime':
        append([`up ${uptimeSeconds} seconds`]);
        break;
      case 'mkdir': {
        const base = requireCwd();
        if (!base) break;
        const recursive = parts[1] === '-p';
        const target = recursive ? parts.slice(2).join(' ') : arg;
        if (!target) {
          append(['Usage: mkdir <name> | mkdir -p <path>']);
          break;
        }
        try {
          if (recursive || target.includes('/')) {
            const full = resolveTerminalPath(target, base);
            const data = await fileAction({ action: 'mkdirp', path: full });
            append([`created ${data.path}`]);
          } else {
            const data = await fileAction({
              action: 'mkdir',
              path: base,
              name: target.replace(/[/\\]/g, ''),
            });
            append([`created ${data.path}`]);
          }
        } catch (e) {
          append([e instanceof Error ? e.message : 'mkdir failed']);
        }
        break;
      }
      case 'touch': {
        const base = requireCwd();
        if (!base || !arg) {
          append(['Usage: touch <file>']);
          break;
        }
        try {
          const full = resolveTerminalPath(arg, base);
          const data = await fileAction({ action: 'touch', path: full });
          append([`touched ${data.path}`]);
        } catch (e) {
          append([e instanceof Error ? e.message : 'touch failed']);
        }
        break;
      }
      case 'rm': {
        const base = requireCwd();
        if (!base) break;
        const flagStr = parts.slice(1).filter((p) => p.startsWith('-')).join('');
        const recursive = flagStr.includes('r');
        const targetPath = parts.slice(1).filter((p) => !p.startsWith('-')).join(' ');
        if (!targetPath) {
          append(['Usage: rm <file> | rm -r <dir>']);
          break;
        }
        try {
          const full = resolveTerminalPath(targetPath, base);
          await fileAction({ action: 'delete', path: full });
          append([`removed ${full}`]);
        } catch (e) {
          append([e instanceof Error ? e.message : 'rm failed']);
        }
        break;
      }
      case 'rmdir': {
        const base = requireCwd();
        if (!base || !arg) {
          append(['Usage: rmdir <dir>']);
          break;
        }
        try {
          const full = resolveTerminalPath(arg, base);
          await fileAction({ action: 'delete', path: full });
          append([`removed ${full}`]);
        } catch (e) {
          append([e instanceof Error ? e.message : 'rmdir failed']);
        }
        break;
      }
      case 'cat': {
        const base = requireCwd();
        if (!base || !arg) {
          append(['Usage: cat <file>']);
          break;
        }
        try {
          const full = resolveTerminalPath(arg, base);
          const res = await fetch('/api/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'read', path: full }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          notifyFileIoComplete();
          const lines = (data.content as string).split('\n');
          append(lines.length ? lines : ['(empty file)']);
        } catch (e) {
          append([e instanceof Error ? e.message : 'cat failed']);
        }
        break;
      }
      case 'curl': {
        const urlArg = parseCurlArgs(parts);
        if (!urlArg) {
          append(['Usage: curl <url>   e.g. curl ascii.live/rick']);
          break;
        }
        await runCurl(urlArg);
        break;
      }
      default:
        append([`command not found: ${name}`]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runCommand(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      if (abortRef.current || animIntervalRef.current !== null) {
        e.preventDefault();
        stopActiveStream();
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const next =
        historyIdx < 0
          ? cmdHistory.length - 1
          : Math.max(0, historyIdx - 1);
      setHistoryIdx(next);
      setInput(cmdHistory[next]);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx < 0) return;
      const next = historyIdx + 1;
      if (next >= cmdHistory.length) {
        setHistoryIdx(-1);
        setInput('');
      } else {
        setHistoryIdx(next);
        setInput(cmdHistory[next]);
      }
    }
  };

  return (
    <AppShell className="font-mono">
      <div
        ref={outputRef}
        className="flex-1 overflow-auto bg-[rgba(4,12,8,0.85)] p-3 text-sm text-emerald-300/90"
      >
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap leading-relaxed">
            {line}
          </div>
        ))}
        {streamLine !== null && (
          <div className="mt-2 whitespace-pre border-t border-emerald-900/50 pt-2 font-mono text-[11px] leading-tight text-emerald-200">
            {streamLine}
            <span className="ml-1 animate-pulse text-emerald-500">▌</span>
          </div>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-emerald-900/40 bg-[rgba(0,0,0,0.25)] px-3 py-2"
      >
        <span className="shrink-0 text-emerald-500">
          {cwd ? `${cwd.split('/').pop()}$` : '$'}
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent text-emerald-100 outline-none caret-emerald-400"
          autoFocus
          spellCheck={false}
          placeholder="help"
        />
      </form>
    </AppShell>
  );
}
