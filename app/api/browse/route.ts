import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);

function isPrivateHost(hostname: string): boolean {
  if (BLOCKED_HOSTS.has(hostname)) return true;
  if (hostname.endsWith('.local')) return true;
  if (hostname.startsWith('10.')) return true;
  if (hostname.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url');
  if (!raw) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(target.protocol)) {
    return NextResponse.json({ error: 'invalid protocol' }, { status: 400 });
  }

  if (isPrivateHost(target.hostname)) {
    return NextResponse.json(
      { error: 'Cannot browse local addresses' },
      { status: 403 }
    );
  }

  try {
    const res = await fetch(target.href, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return new NextResponse(
        `<html><body style="font-family:system-ui;background:#111;color:#eee;padding:2rem">
        <h2>Cannot preview this file type</h2>
        <p>${contentType}</p>
        <p><a href="${target.href}" target="_blank" rel="noopener">Open in new tab</a></p>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    let html = await res.text();
    const base = target.origin + target.pathname.replace(/\/[^/]*$/, '/');
    const baseTag = `<base href="${target.origin}/" target="_blank">`;
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, `$&${baseTag}`);
    } else {
      html = `<head>${baseTag}</head>${html}`;
    }
    html = html.replace(
      /<meta[^>]+http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi,
      ''
    );

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-WebOS-Proxy': '1',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Fetch failed';
    return new NextResponse(
      `<html><body style="font-family:system-ui;background:#0f1117;color:#e2e8f0;padding:2rem">
      <h2>Could not load page</h2>
      <p>${msg}</p>
      <p><a href="${target.href}" target="_blank" rel="noopener" style="color:#818cf8">Open ${target.hostname} in new tab</a></p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
