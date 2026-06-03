'use client';

import { Position, DemoAssetPrice } from './useDemoTrading';

interface PositionManagerProps {
  openPositions: Position[];
  prices: DemoAssetPrice[];
  onClosePosition: (positionId: number) => Promise<void>;
  isLoading: boolean;
}

export function PositionManager({
  openPositions,
  prices,
  onClosePosition,
  isLoading,
}: PositionManagerProps) {
  if (openPositions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-6 border border-slate-800 text-center">
        <h3 className="text-lg font-semibold text-white mb-4">📈 Open Positions</h3>
        <p className="text-slate-400">No open positions. Open a trade to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-6 border border-slate-800 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <span className="text-xl">📈</span>
        Open Positions ({openPositions.length})
      </h3>

      <div className="space-y-4">
        {openPositions.map((position) => {
          const currentPrice = prices.find((p) => p.symbol === position.dAsset)?.priceUsd || position.entryPrice;
          const priceDelta = position.isLong ? currentPrice - position.entryPrice : position.entryPrice - currentPrice;
          const pnlPercent = (priceDelta / position.entryPrice) * 100;
          const marginUsd = parseFloat(position.margin) * (prices.find((p) => p.symbol === position.dAsset)?.priceUsd || 0);
          const pnlUsd = marginUsd * (pnlPercent / 100);

          const canClose =
            Math.floor(Date.now() / 1000) - position.openTime >= 600; // 10 minutes hold time

          return (
            <div
              key={position.id}
              className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">
                      {position.isLong ? '📈' : '📉'}
                    </span>
                    <span className="font-bold text-white">
                      {position.isLong ? 'LONG' : 'SHORT'} {position.dAsset}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Position #{position.id} • Opened{' '}
                    {new Date(position.openTime * 1000).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${
                      pnlUsd >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {pnlUsd >= 0 ? '+' : ''}{pnlUsd.toFixed(2)} USD
                  </div>
                  <div className={`text-sm font-semibold ${pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b border-slate-700">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Margin</div>
                  <div className="font-semibold text-slate-200">{position.margin} TokenA</div>
                  <div className="text-xs text-slate-500">${marginUsd.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Entry Price</div>
                  <div className="font-semibold text-slate-200">
                    ${position.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Current Price</div>
                  <div className="font-semibold text-slate-200">
                    ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Price Change</div>
                  <div className={`font-semibold ${priceDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceDelta >= 0 ? '+' : ''}{priceDelta.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Holding Time */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Holding Time</span>
                  <span className="text-xs text-slate-400">
                    {Math.floor((Date.now() / 1000 - position.openTime) / 60)} min
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        ((Date.now() / 1000 - position.openTime) / 600) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
                {!canClose && (
                  <p className="text-xs text-yellow-400 mt-1">
                    ⏱️ Hold for {Math.ceil(600 - (Date.now() / 1000 - position.openTime))} more seconds
                  </p>
                )}
              </div>

              {/* Profit Threshold */}
              {pnlPercent >= 0 && pnlPercent < 10 && (
                <div className="mb-4 bg-yellow-900/30 border border-yellow-700/50 rounded p-2 text-xs text-yellow-300">
                  📈 Need {(10 - pnlPercent).toFixed(2)}% more profit to earn rewards
                </div>
              )}

              {pnlPercent >= 10 && (
                <div className="mb-4 bg-green-900/30 border border-green-700/50 rounded p-2 text-xs text-green-300">
                  ✅ Eligible for rewards! Close to claim points
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => onClosePosition(position.id)}
                disabled={!canClose || isLoading}
                className={`w-full py-2 rounded-lg font-semibold transition-all ${
                  canClose && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? '⏳ Closing...' : '🔒 Close Position'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
