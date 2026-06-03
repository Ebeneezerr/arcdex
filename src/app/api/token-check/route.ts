import { NextResponse, NextRequest } from 'next/server';
import { ListingGate, defaultConfig } from '@hydra/listing-gate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function createListingGate() {
  const rpc = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || '';
  if (!rpc) throw new Error('RPC URL not configured');
  return new ListingGate({ ...defaultConfig, rpcUrl: rpc });
}

export async function POST(req: NextRequest) {
  try {
    const gate = createListingGate();
    const body = await req.json();
    const { tokenAddress, chainId, pairWith } = body;
    if (!tokenAddress || !chainId) {
      return NextResponse.json({ error: 'tokenAddress and chainId required' }, { status: 400 });
    }
    const result = await gate.check({ tokenAddress, chainId, pairWith });
    return NextResponse.json(result);
  } catch (err) {
    console.error('token-check route error', err);
    return NextResponse.json({ error: 'Token check unavailable' }, { status: 500 });
  }
}
