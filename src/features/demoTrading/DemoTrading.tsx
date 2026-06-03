'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useDemoTrading } from './useDemoTrading';
import { PositionManager } from './PositionManager';
import { PriceDisplay } from './PriceDisplay';
import { TradeForm } from './TradeForm';

type DemoTradingProps = {
  demoTradingAddress: string;
  tokenAAddress: string;
  tokenBAddress: string;
  oracleAddress: string;
};

export default function DemoTrading({
  demoTradingAddress,
  tokenAAddress,
  tokenBAddress,
  oracleAddress,
}: DemoTradingProps) {
  const { address: userAddress, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'trade' | 'positions' | 'history'>('trade');
  const [isLoading, setIsLoading] = useState(false);

  const {
    prices,
    positions,
    openPositions,
    tradingStats,
    errors,
    openPosition,
    closePosition,
    refreshData,
    clearError,
  } = useDemoTrading(
    demoTradingAddress,
    tokenAAddress,
    tokenBAddress,
    oracleAddress,
    userAddress
  );

  // Auto-refresh data every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshData]);

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-8 border border-slate-800 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">🎮 Demo Trading</h2>
        <p className="text-slate-400">Connect your wallet to start trading</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-4xl">🎮</span>
              Demo Trading
            </h2>
            <p className="text-slate-400 mt-2">Trade with real market data, no real funds at risk</p>
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            {isLoading ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Open Positions</div>
            <div className="text-2xl font-bold text-cyan-400">{openPositions.length}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Total Trades</div>
            <div className="text-2xl font-bold text-blue-400">{positions.length}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Win Rate</div>
            <div className="text-2xl font-bold text-green-400">
              {tradingStats.totalTrades > 0
                ? ((tradingStats.winningTrades / tradingStats.totalTrades) * 100).toFixed(1)
                : 0}
              %
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {errors && errors.length > 0 && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-red-200 mb-2">⚠️ Errors</h3>
              {errors.map((error, i) => (
                <p key={i} className="text-red-200 text-sm mb-1">
                  • {error}
                </p>
              ))}
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-700">
        {['trade', 'positions', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab === 'trade' && '📊 Trade'}
            {tab === 'positions' && '📈 Open Positions'}
            {tab === 'history' && '📜 History'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'trade' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prices */}
            <PriceDisplay prices={prices} />

            {/* Trade Form */}
            <TradeForm
              prices={prices}
              onOpenPosition={openPosition}
              isLoading={isLoading}
            />
          </div>
        )}

        {activeTab === 'positions' && (
          <PositionManager
            openPositions={openPositions}
            prices={prices}
            onClosePosition={closePosition}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'history' && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-6 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-4">Trading History</h3>
            {positions.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No trading history yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {positions.map((position, i) => (
                  <div key={i} className="bg-slate-800/50 rounded p-3 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-slate-300">
                          Position {i + 1} • {position.isLong ? '📈 Long' : '📉 Short'}
                        </div>
                        <div className="text-slate-500 text-xs">
                          Margin: {position.margin} TokenA
                        </div>
                      </div>
                      <div className={`font-bold ${position.pnl && position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {position.pnl ? (position.pnl >= 0 ? '+' : '') + position.pnl : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-4">
        <div className="text-sm text-cyan-300">
          <p className="font-semibold mb-2">💡 Demo Trading Tips:</p>
          <ul className="space-y-1 text-xs">
            <li>• Hold positions for at least 10 minutes</li>
            <li>• Need 10% profit to receive rewards</li>
            <li>• Minimum margin: $100 USD</li>
            <li>• Earn points for profitable trades</li>
            <li>• Prices update every 10 seconds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
