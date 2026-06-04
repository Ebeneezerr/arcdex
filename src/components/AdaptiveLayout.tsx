'use client';

import { useTheme } from '../hooks/useTheme';
import { useEcosystemHealth } from '../hooks/useEcosystemHealth';
import HealthBanner from './HealthBanner';
import { Widget } from './Widget';

const ADAPTIVE_OVERRIDES: Record<string, {
  dashboardOrder: string[];
  bannerMessage: string;
  bannerSeverity: 'info' | 'warn' | 'critical';
  emphasisWidgets: string[];
  ctaLabel?: string;
  ctaTarget?: string;
} | null> = {
  STABLE: null,
  LIQUIDITY_CRISIS: {
    dashboardOrder: ['liquidity', 'swap', 'rewards', 'analytics', 'governance', 'price-chart'],
    bannerMessage: 'Liquidity is running low. Add liquidity to earn boosted rewards.',
    bannerSeverity: 'warn',
    emphasisWidgets: ['liquidity'],
    ctaLabel: 'Add Liquidity',
    ctaTarget: '/liquidity/add'
  },
  GOVERNANCE_SEASON: {
    dashboardOrder: ['governance', 'rewards', 'swap', 'liquidity', 'analytics', 'price-chart'],
    bannerMessage: 'Active proposals are open for voting.',
    bannerSeverity: 'info',
    emphasisWidgets: ['governance'],
    ctaLabel: 'View Proposals',
    ctaTarget: '/governance'
  },
  HIGH_VOLATILITY: {
    dashboardOrder: ['price-chart', 'swap', 'analytics', 'liquidity', 'rewards', 'governance'],
    bannerMessage: 'Market activity is elevated. Review positions before trading.',
    bannerSeverity: 'warn',
    emphasisWidgets: ['price-chart', 'analytics'],
    ctaLabel: undefined,
    ctaTarget: undefined
  },
  LOW_RETENTION: {
    dashboardOrder: ['rewards', 'swap', 'liquidity', 'leaderboard', 'governance', 'analytics'],
    bannerMessage: 'Earn rewards for staying active. Streaks unlock bonus emissions.',
    bannerSeverity: 'info',
    emphasisWidgets: ['rewards', 'leaderboard'],
    ctaLabel: 'View Rewards',
    ctaTarget: '/rewards'
  },
  REWARD_DRAIN: {
    dashboardOrder: ['rewards', 'governance', 'swap', 'liquidity', 'analytics', 'price-chart'],
    bannerMessage: 'Reward emissions are running low. Governance vote may adjust rates.',
    bannerSeverity: 'warn',
    emphasisWidgets: ['rewards', 'governance'],
    ctaLabel: 'View Emissions',
    ctaTarget: '/governance/emissions'
  },
  CRITICAL: {
    dashboardOrder: ['analytics', 'liquidity', 'swap', 'rewards', 'governance', 'price-chart'],
    bannerMessage: 'Security alert detected. Exercise caution.',
    bannerSeverity: 'critical',
    emphasisWidgets: ['analytics'],
    ctaLabel: undefined,
    ctaTarget: undefined
  }
};

export default function AdaptiveLayout() {
  const theme = useTheme();
  const health = useEcosystemHealth();
  const override = ADAPTIVE_OVERRIDES[health.signal];
  const dashboardOrder = override?.dashboardOrder ?? theme.dashboardOrder;
  const emphasisSet = new Set(override?.emphasisWidgets ?? []);

  return (
    <section
      className="adaptive-layout mx-auto py-10"
      style={{ maxWidth: `${theme.maxContentWidth}px` }}
      data-health={health.signal}
    >
      {override && (
        <HealthBanner
          message={override.bannerMessage}
          severity={override.bannerSeverity}
          ctaLabel={override.ctaLabel}
          ctaTarget={override.ctaTarget}
        />
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {dashboardOrder.map((widgetId) => (
          <Widget
            key={widgetId}
            id={widgetId}
            emphasized={emphasisSet.has(widgetId)}
          />
        ))}
      </div>
    </section>
  );
}
