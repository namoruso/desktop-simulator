import { NextResponse } from 'next/server';
import { collectStorage } from '@/lib/collectStorage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const snapshot = await collectStorage();
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error('[API] storage:', err);
    return NextResponse.json({ error: 'Failed to read storage' }, { status: 500 });
  }
}
