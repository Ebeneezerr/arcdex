'use client';

import { DemoAssetPrice } from './useDemoTrading';

interface PriceDisplayProps {
  prices: DemoAssetPrice[];
}

export function PriceDisplay({ prices }: PriceDisplayProps) {
  if (prices.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-6 border border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">💹 Live Prices</h3>
        <div className="text-center text-slate-400 py-8">Loading prices...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-6 border border-slate-800 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-xl">💹</span>
        Live Market Prices
      </h3>

      <div className="space-y-2">
        {prices.map((asset) => (
          <div
            key={asset.symbol}
            className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800 transition-colors"
          >
            <div>
              <div className="font-semibold text-slate-200">{asset.symbol}</div>
              <div className="text-xs text-slate-500">
                Updated {new Date(asset.lastUpdate).toLocaleTimeString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-400">
                ${asset.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-400">
                {(asset.priceUsd8 / BigInt(1e8)).toString()} USD
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-400">
          ℹ️ Prices refresh automatically every 10 seconds from live market data
        </p>
      </div>
    </div>
  );
}
