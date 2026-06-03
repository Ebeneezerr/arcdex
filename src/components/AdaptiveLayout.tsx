'use client';

import { useTheme } from '../hooks/useTheme';
import { useEcosystemHealth } from '../hooks/useEcosystemHealth';
import { ADAPTIVE_OVERRIDES } from '@hydra/dna-engine';
import HealthBanner from './HealthBanner';
import { Widget } from './Widget';

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
