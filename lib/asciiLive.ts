/** Map curl targets to ascii.live animation names. */
export function asciiLiveAnimation(url: URL): string | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (host !== 'ascii.live') return null;
  const path = url.pathname.replace(/\/$/, '') || '/';
  const name = path.slice(1);
  if (!name || name.includes('/')) return null;
  return name;
}
