import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type AudioBackend = 'wpctl' | 'pactl' | 'amixer' | 'none';

export interface AudioState {
  volume: number;
  muted: boolean;
  backend: AudioBackend;
  sink?: string;
}

async function run(cmd: string, timeout = 4000): Promise<string> {
  const { stdout } = await execAsync(cmd, { timeout });
  return stdout.trim();
}

/** PipeWire / WirePlumber (Fedora default). */
async function readWpctl(): Promise<AudioState | null> {
  try {
    const out = await run('wpctl get-volume @DEFAULT_AUDIO_SINK@ 2>/dev/null');
    const muted = (await run('wpctl get-mute @DEFAULT_AUDIO_SINK@ 2>/dev/null')).includes(
      'true'
    );
    const match = out.match(/([\d.]+)/);
    const vol = match ? Math.round(parseFloat(match[1]) * 100) : 50;
    return { volume: Math.min(100, Math.max(0, vol)), muted, backend: 'wpctl' };
  } catch {
    return null;
  }
}

async function setWpctl(volume: number, muted?: boolean): Promise<boolean> {
  try {
    const v = (volume / 100).toFixed(2);
    await run(`wpctl set-volume @DEFAULT_AUDIO_SINK@ ${v} 2>/dev/null`);
    if (muted !== undefined) {
      await run(
        `wpctl set-mute @DEFAULT_AUDIO_SINK@ ${muted ? '1' : '0'} 2>/dev/null`
      );
    }
    return true;
  } catch {
    return false;
  }
}

async function readPactl(): Promise<AudioState | null> {
  try {
    const out = await run(
      "pactl get-sink-volume @DEFAULT_SINK@ 2>/dev/null | head -1"
    );
    const muted = (await run('pactl get-sink-mute @DEFAULT_SINK@ 2>/dev/null')).includes(
      'yes'
    );
    const match = out.match(/(\d+)%/);
    const vol = match ? parseInt(match[1], 10) : 50;
    return { volume: vol, muted, backend: 'pactl' };
  } catch {
    return null;
  }
}

async function setPactl(volume: number, muted?: boolean): Promise<boolean> {
  try {
    await run(`pactl set-sink-volume @DEFAULT_SINK@ ${volume}% 2>/dev/null`);
    if (muted !== undefined) {
      await run(`pactl set-sink-mute @DEFAULT_SINK@ ${muted ? '1' : '0'} 2>/dev/null`);
    }
    return true;
  } catch {
    return false;
  }
}

async function readAmixer(): Promise<AudioState | null> {
  try {
    const out = await run("amixer get Master 2>/dev/null | grep -oP '\\d+%' | head -1");
    const match = out.match(/(\d+)%/);
    const vol = match ? parseInt(match[1], 10) : 50;
    const muted = out.toLowerCase().includes('[off]') || vol === 0;
    return { volume: vol, muted, backend: 'amixer' };
  } catch {
    return null;
  }
}

async function setAmixer(volume: number, muted?: boolean): Promise<boolean> {
  try {
    if (muted !== undefined) {
      await run(`amixer set Master ${muted ? 'mute' : 'unmute'} 2>/dev/null`);
    }
    await run(`amixer set Master ${volume}% 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

export async function getHostAudio(): Promise<AudioState> {
  return (
    (await readWpctl()) ??
    (await readPactl()) ??
    (await readAmixer()) ?? {
      volume: 70,
      muted: false,
      backend: 'none',
    }
  );
}

export async function setHostAudio(
  volume: number,
  muted?: boolean
): Promise<AudioState> {
  const v = Math.min(100, Math.max(0, Math.round(volume)));
  const current = await getHostAudio();

  if (current.backend === 'wpctl') {
    if (await setWpctl(v, muted)) return getHostAudio();
  }
  if (current.backend === 'pactl' || (await readPactl())) {
    if (await setPactl(v, muted)) return getHostAudio();
  }
  if (await setAmixer(v, muted)) return getHostAudio();

  return { volume: v, muted: muted ?? false, backend: 'none' };
}
