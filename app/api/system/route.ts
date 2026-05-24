import { NextResponse } from 'next/server';
import { collectSystemData } from '@/lib/collectSystemData';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const snapshot = await collectSystemData();
    return NextResponse.json({
      type: 'system_snapshot',
      payload: snapshot,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('[API] system snapshot error:', err);
    return NextResponse.json(
      { error: 'Failed to collect system data' },
      { status: 500 }
    );
  }
}
