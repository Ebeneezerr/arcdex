import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'Token check unavailable in standalone deployment' },
    { status: 503 }
  );
}
