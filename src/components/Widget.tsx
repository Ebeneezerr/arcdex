interface WidgetProps {
  id: string;
  emphasized?: boolean;
}

const WIDGET_LABELS: Record<string, string> = {
  'price-chart': 'Price Chart',
  orderbook: 'Order Book',
  swap: 'Swap',
  volume: 'Volume',
  liquidity: 'Liquidity',
  rewards: 'Rewards',
  governance: 'Governance',
  leaderboard: 'Leaderboard',
  quests: 'Quests',
  achievements: 'Achievements',
  analytics: 'Analytics'
};

export function Widget({ id, emphasized = false }: WidgetProps) {
  return (
    <article
      className={`rounded-3xl border p-6 transition ${
        emphasized
          ? 'border-blue-400/40 bg-slate-900 shadow-[0_25px_60px_-30px_rgba(56,189,248,0.9)]'
          : 'border-slate-700 bg-slate-950/70'
      }`}
      data-widget={id}
    >
      <div className="text-sm uppercase tracking-[0.22em] text-slate-400">{WIDGET_LABELS[id] ?? id}</div>
      <div className="mt-4 text-xl font-semibold text-white">{WIDGET_LABELS[id] ?? id}</div>
      <p className="mt-3 text-sm text-slate-400">
        {emphasized ? 'Highlighted due to current ecosystem health.' : 'Core operational view.'}
      </p>
    </article>
  );
}
