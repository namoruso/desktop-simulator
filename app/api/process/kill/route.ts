import { NextRequest, NextResponse } from 'next/server';
import { appendServerIoLog } from '@/lib/serverIoLog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pid = parseInt(String(body.pid), 10);
    const signal = body.signal === 'SIGKILL' ? 'SIGKILL' : 'SIGTERM';

    if (!pid || pid <= 0) {
      return NextResponse.json({ error: 'Invalid PID' }, { status: 400 });
    }

    if (pid === process.pid) {
      return NextResponse.json(
        { error: 'Cannot terminate the WebOS server process' },
        { status: 403 }
      );
    }

    try {
      process.kill(pid, signal);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Kill failed';
      if (msg.includes('ESRCH')) {
        return NextResponse.json({ error: 'Process not found' }, { status: 404 });
      }
      if (msg.includes('EPERM')) {
        return NextResponse.json(
          { error: 'Permission denied — try running WebOS with appropriate privileges' },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    appendServerIoLog({
      direction: 'out',
      source: 'process',
      summary: `Sent ${signal} to PID ${pid}`,
    });

    return NextResponse.json({ ok: true, pid, signal });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Kill failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
