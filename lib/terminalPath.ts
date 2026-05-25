/** Resolve a shell-style path against the terminal cwd (browser-safe). */
export function resolveTerminalPath(raw: string, cwd: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return cwd;

  if (trimmed.startsWith('/')) {
    const parts = trimmed.split('/').filter((p) => p && p !== '.');
    const stack: string[] = [];
    for (const p of parts) {
      if (p === '..') stack.pop();
      else stack.push(p);
    }
    return '/' + stack.join('/');
  }

  const parts = cwd.split('/').filter(Boolean);
  for (const seg of trimmed.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return '/' + parts.join('/');
}
