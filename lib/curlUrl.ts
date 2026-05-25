const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
]);

const PRIVATE_IPV4 =
  /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/;

/** Normalize `ascii.live/rick` → `https://ascii.live/rick` and block SSRF targets. */
export function parseCurlUrl(input: string): URL {
  let raw = input.trim();
  if (!raw) throw new Error('URL required');
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }
  const url = new URL(raw);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http and https URLs are allowed');
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.local')) {
    throw new Error('URL host not allowed');
  }
  if (PRIVATE_IPV4.test(host)) {
    throw new Error('Private network URLs are not allowed');
  }
  return url;
}
