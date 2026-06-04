import { useEffect, useState } from 'react';

type HealthSignal =
  | 'STABLE'
  | 'LIQUIDITY_CRISIS'
  | 'GOVERNANCE_SEASON'
  | 'HIGH_VOLATILITY'
  | 'LOW_RETENTION'
  | 'REWARD_DRAIN'
  | 'CRITICAL';

export interface EcosystemHealthState {
  signal: HealthSignal;
  alertCount: number;
  lastAlert: unknown;
  loading: boolean;
}

const POLL_INTERVAL_MS = 60_000;

export function useEcosystemHealth(): EcosystemHealthState {
  const [state, setState] = useState<EcosystemHealthState>({
    signal: 'STABLE',
    alertCount: 0,
    lastAlert: null,
    loading: true
  });

  useEffect(() => {
    let shouldAbort = false;

    async function fetchHealth() {
      try {
        const res = await fetch('/api/ecosystem-health');
        const data = await res.json();

        if (shouldAbort) return;

        setState({
          signal: data.signal ?? 'STABLE',
          alertCount: typeof data.alertCount === 'number' ? data.alertCount : 0,
          lastAlert: data.lastAlert ?? null,
          loading: false
        });
      } catch {
        if (shouldAbort) return;
        setState((current) => ({ ...current, loading: false }));
      }
    }

    fetchHealth();
    const interval = setInterval(fetchHealth, POLL_INTERVAL_MS);
    return () => {
      shouldAbort = true;
      clearInterval(interval);
    };
  }, []);

  return state;
}
