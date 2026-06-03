'use client';

import { useState } from 'react';
import { DemoAssetPrice } from './useDemoTrading';

interface TradeFormProps {
  prices: DemoAssetPrice[];
  onOpenPosition: (assetSymbol: string, margin: string, isLong: boolean) => Promise<void>;
  isLoading: boolean;
}

export function TradeForm({ prices, onOpenPosition, isLoading }: TradeFormProps) {
  const [selectedAsset, setSelectedAsset] = useState<string>(prices[0]?.symbol || 'dBTC');
  const [margin, setMargin] = useState<string>('1000');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPrice = prices.find((p) => p.symbol === selectedAsset);
  const marginUsd = parseFloat(margin) * (selectedPrice?.priceUsd || 0);
  const isValid = parseFloat(margin) > 0 && marginUsd >= 100; // $100 minimum

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onOpenPosition(selectedAsset, margin, direction === 'long');
      // Reset form
      setMargin('1000');
      setDirection('long');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-6 border border-slate-800 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <span className="text-xl">📊</span>
        Open Position
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Asset Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Trading Asset
          </label>
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            {prices.map((asset) => (
              <option key={asset.symbol} value={asset.symbol}>
                {asset.symbol} - ${asset.priceUsd}
              </option>
            ))}
          </select>
        </div>

        {/* Margin Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Margin (TokenA)
          </label>
          <div className="relative">
            <input
              type="number"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              placeholder="1000"
              min="0"
              step="100"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
            <div className="mt-2 text-xs text-slate-400">
              ${marginUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              {marginUsd < 100 && marginUsd > 0 && (
                <span className="text-red-400"> • Below $100 minimum</span>
              )}
            </div>
          </div>
        </div>

        {/* Direction Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Direction
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDirection('long')}
              className={`py-3 rounded-lg font-semibold transition-all ${
                direction === 'long'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              📈 Long
            </button>
            <button
              type="button"
              onClick={() => setDirection('short')}
              className={`py-3 rounded-lg font-semibold transition-all ${
                direction === 'short'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              📉 Short
            </button>
          </div>
        </div>

        {/* Summary Box */}
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Entry Price:</span>
            <span className="text-white font-semibold">
              ${selectedPrice?.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Margin (USD):</span>
            <span className="text-white font-semibold">
              ${marginUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Min Profit for Reward:</span>
            <span className="text-blue-400 font-semibold">
              ${(marginUsd * 0.1).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isSubmitting || isLoading}
          className={`w-full py-3 rounded-lg font-bold transition-all ${
            isValid && !isSubmitting && !isLoading
              ? direction === 'long'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? '⏳ Opening...' : `${direction === 'long' ? '📈' : '📉'} Open ${direction.toUpperCase()} Position`}
        </button>
      </form>

      {/* Rules */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong>Rules:</strong> Min margin $100 • Hold 10+ min • Need 10% profit for rewards • Margin at risk if price moves against you
        </p>
      </div>
    </div>
  );
}
