"use client";

import { useDashboard } from "@/lib/dashboardContext";

export function PointsDisplay() {
  const { userMetrics } = useDashboard();

  if (!userMetrics) {
    return (
      <div className="bg-gradient-to-br from-purple-900 to-purple-950 rounded-lg p-6 border border-purple-800 shadow-lg">
        <div className="animate-pulse">
          <div className="h-8 bg-purple-800 rounded w-40 mb-4"></div>
          <div className="h-6 bg-purple-800 rounded w-32"></div>
        </div>
      </div>
    );
  }

  const lifetimePoints = Number(userMetrics.lifetimePoints);
  const reputation = Number(userMetrics.reputationScore);
  const maxReputation = 10000;
  const reputationPercent = (reputation / maxReputation) * 100;

  return (
    <div className="bg-gradient-to-br from-purple-900 to-purple-950 rounded-lg p-6 border border-purple-800 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">⭐</span>
        Your Points & Reputation
      </h3>

      <div className="space-y-4">
        {/* Lifetime Points */}
        <div className="bg-purple-800/50 rounded p-4">
          <div className="text-sm text-purple-200 mb-2">Lifetime Points</div>
          <div className="text-3xl font-bold text-purple-100">
            {lifetimePoints.toLocaleString()}
          </div>
          <div className="text-xs text-purple-300 mt-1">
            All-time rewards earned
          </div>
        </div>

        {/* Reputation Score */}
        <div className="bg-purple-800/50 rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-purple-200">Reputation Score</div>
            <span className="text-xs font-mono text-purple-300">
              {reputation} / {maxReputation}
            </span>
          </div>

          <div className="w-full bg-purple-950 rounded-full h-3 overflow-hidden mb-2">
            <div
              className="h-3 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(reputationPercent, 100)}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-xs">
            <span className={reputation < 1000 ? "text-red-400" : "text-green-400"}>
              {reputation < 1000 ? "⚠️ Low Reputation" : "✓ Good Standing"}
            </span>
            <span className="text-purple-300">{reputationPercent.toFixed(1)}%</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="bg-purple-800/50 rounded p-3 text-center">
          <div className="text-xs text-purple-300 mb-2">Account Status</div>
          <div className="flex items-center justify-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                reputation > 5000 ? "bg-green-500" : reputation > 1000 ? "bg-yellow-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm font-semibold text-purple-100">
              {reputation > 5000 ? "Trusted" : reputation > 1000 ? "Active" : "At Risk"}
            </span>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-cyan-900/30 border border-cyan-700 rounded p-3 text-xs text-cyan-200">
          <strong>💡 Tip:</strong> Interact with multiple modules to earn diversity bonuses and maintain your reputation.
        </div>
      </div>
    </div>
  );
}
