import { useTheme } from '../hooks/useTheme';

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
  'token-metrics': 'Token Metrics'
};

export function Dashboard() {
  const theme = useTheme();

  return (
    <section className="mx-auto py-10" style={{ maxWidth: `${theme.maxContentWidth}px` }}>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">Rendered in the order defined by theme layout.</p>
      </header>

      <div className="grid gap-6">
        {theme.dashboardOrder.map((widget) => (
          <article
            key={widget}
            className="rounded-2xl border border-slate-700/80 bg-slate-950/80 p-6 shadow-lg"
          >
            <div className="text-sm uppercase tracking-[0.24em] text-slate-500">
              {WIDGET_LABELS[widget] ?? widget}
            </div>
            <div className="mt-3 text-xl font-bold text-white">{WIDGET_LABELS[widget] ?? widget}</div>
            <p className="mt-2 text-sm text-slate-400">
              A flexible placeholder panel rendered by the current theme.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
