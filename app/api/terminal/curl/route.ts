import { NextRequest, NextResponse } from 'next/server';
import { parseCurlUrl } from '@/lib/curlUrl';
import { appendServerIoLog } from '@/lib/serverIoLog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CONNECT_MS = 8_000;
const MAX_DURATION_MS = 120_000;
const CURL_USER_AGENT = 'curl/8.4.0 (WebOS Simulator)';

export async function GET(req: NextRequest) {
  try {
    const rawUrl = req.nextUrl.searchParams.get('url');
    if (!rawUrl) {
      return NextResponse.json({ error: 'url required' }, { status: 400 });
    }

    const url = parseCurlUrl(rawUrl);
    const controller = new AbortController();
    const connectTimer = setTimeout(() => controller.abort(), CONNECT_MS);
    const maxTimer = setTimeout(() => controller.abort(), MAX_DURATION_MS);

    let upstream: Response;
    try {
      upstream = await fetch(url.toString(), {
        headers: {
          'User-Agent': CURL_USER_AGENT,
          Accept: '*/*',
        },
        signal: controller.signal,
        cache: 'no-store',
      });
    } catch (err) {
      clearTimeout(connectTimer);
      clearTimeout(maxTimer);
      throw err;
    }
    clearTimeout(connectTimer);

    if (!upstream.ok) {
      clearTimeout(maxTimer);
      const text = await upstream.text().catch(() => '');
      let message = `HTTP ${upstream.status}`;
      try {
        const json = JSON.parse(text) as { error?: string };
        if (json.error) message = json.error;
      } catch {
        if (text) message = text.slice(0, 200);
      }
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    appendServerIoLog({
      direction: 'in',
      source: 'terminal/curl',
      summary: `GET ${url.hostname}${url.pathname}`,
    });

    if (!upstream.body) {
      const text = await upstream.text();
      return new NextResponse(text, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const stream = new ReadableStream({
      async start(out) {
        const reader = upstream.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) out.enqueue(value);
          }
          out.close();
        } catch (err) {
          out.error(err);
        } finally {
          clearTimeout(maxTimer);
          reader.releaseLock();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type':
          upstream.headers.get('Content-Type') ?? 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.name === 'AbortError'
          ? 'Stream ended (max 120s — press Ctrl+C to stop earlier)'
          : err.message
        : 'curl failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
