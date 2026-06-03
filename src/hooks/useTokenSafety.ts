import { useState } from 'react';
import type { TokenCheckResponse } from '@hydra/listing-gate';

export function useTokenSafety() {
  const [result, setResult] = useState<TokenCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkToken(tokenAddress: string, chainId: number, pairWith?: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/token-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress, chainId, pairWith })
      });
      const data = await res.json();
      setResult(data as TokenCheckResponse);
      return data as TokenCheckResponse;
    } finally {
      setLoading(false);
    }
  }

  return { result, loading, checkToken } as const;
}
