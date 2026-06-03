import React from 'react';
import type { TokenCheckResponse } from '@hydra/listing-gate';

export default function TokenSafetyBadge({ result }: { result: TokenCheckResponse | null }) {
  if (!result) return null;

  if (result.blocked) {
    return (
      <div style={{ padding: '8px', background: '#ffe6e6', color: '#a00', borderRadius: 6 }}>
        <strong>⛔ Listing blocked</strong>
        <div style={{ marginTop: 6 }}>{result.warnings.map((w) => (<div key={w.code}>{w.message}</div>))}</div>
      </div>
    );
  }

  if (result.verdict === 'CAUTION') {
    return (
      <div style={{ padding: '8px', background: '#fff4e5', color: '#663c00', borderRadius: 6 }}>
        <strong>⚠️ Risk detected</strong>
        <div style={{ marginTop: 6 }}>{result.warnings.map((w) => (<div key={w.code}>{w.message}</div>))}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '6px 8px', background: '#e6ffef', color: '#046a38', borderRadius: 6 }}>
      ✅ Token verified
    </div>
  );
}
