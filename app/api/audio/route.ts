import { NextRequest, NextResponse } from 'next/server';
import { getHostAudio, setHostAudio } from '@/lib/hostAudio';
import { appendServerIoLog } from '@/lib/serverIoLog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const state = await getHostAudio();
    return NextResponse.json(state);
  } catch (err) {
    console.error('[API] audio GET:', err);
    return NextResponse.json(
      { volume: 70, muted: false, backend: 'none', error: 'Failed to read audio' },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const volume = typeof body.volume === 'number' ? body.volume : undefined;
    const muted = typeof body.muted === 'boolean' ? body.muted : undefined;

    if (volume === undefined && muted === undefined) {
      return NextResponse.json({ error: 'volume or muted required' }, { status: 400 });
    }

    const state = await setHostAudio(volume ?? (await getHostAudio()).volume, muted);
    appendServerIoLog({
      direction: 'out',
      source: 'audio',
      summary: `Volume ${state.volume}%${state.muted ? ' (muted)' : ''} via ${state.backend}`,
    });
    return NextResponse.json(state);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to set audio';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
