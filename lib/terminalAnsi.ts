const CLEAR_SCREEN = '\u001b[2J\u001b[H';

/** Pick the latest ascii.live frame from a growing curl buffer. */
export function latestAsciiFrame(buffer: string): string {
  const parts = buffer.split(CLEAR_SCREEN);
  const raw = parts[parts.length - 1] ?? buffer;
  return stripAnsi(raw).replace(/\r/g, '').trimEnd();
}

export function stripAnsi(text: string): string {
  return text
    .replace(/\u001b\][^\u0007]*\u0007/g, '')
    .replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');
}
