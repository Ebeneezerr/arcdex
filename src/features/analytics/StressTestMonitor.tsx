"use client";

import { useState, useEffect } from "react";

interface StressMetrics {
  timestamp: number;
  activeUsers: number;
  transactionsPerSecond: number;
  averageResponseTime: number;
  peakMemory: number;
  errorRate: number;
  pointsAwarded: string;
  faucetClaimsProcessed: number;
  moduleActionsProcessed: number;
}

interface StressSummary {
  timeframe: string;
  totalDataPoints: number;
  avgResponseTime: string;
  avgTps: string;
  peakTps: string;
  peakUsers: number;
  dashboardHealth: {
    status: "healthy" | "warning" | "critical";
    responseTimeOk: boolean;
    errorRateOk: boolean;
    memoryOk: boolean;
  };
  throughput: {
    totalActionsProcessed: number;
    actionsPerSecond: string;
    totalPointsAwarded: string;
    averagePointsPerAction: string;
    faucetInteractionRate: string;
  };
}

export function StressTestMonitor() {
  const [current, setCurrent] = useState<StressMetrics | null>(null);
  const [summary, setSummary] = useState<StressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(60); // minutes
  const [error, setError] = useState<string | null>(null);

  const fetchStressMetrics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/stress-metrics?duration=${duration}`);

      if (response.ok) {
        const data = await response.json();
        setCurrent(data.data.current);
        setSummary(data.data.summary);
      } else {
        setError("Failed to fetch stress metrics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStressMetrics();
    const interval = setInterval(fetchStressMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [duration]);

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "critical":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getHealthBg = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-900/20 border-green-700";
      case "warning":
        return "bg-yellow-900/20 border-yellow-700";
      case "critical":
        return "bg-red-900/20 border-red-700";
      default:
        return "bg-gray-900/20 border-gray-700";
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-6 border border-slate-800 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          Stress Test Monitor
        </h3>
        <button
          onClick={fetchStressMetrics}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition-all"
        >
          Refresh
        </button>
      </div>

      {/* Duration Filter */}
      <div className="flex gap-2 mb-6">
        {[15, 30, 60, 240].map((mins) => (
          <button
            key={mins}
            onClick={() => setDuration(mins)}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              duration === mins
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {mins}m
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-slate-400">Loading metrics...</div>
      ) : error ? (
        <div className="text-center py-6 text-red-400">{error}</div>
      ) : (
        <>
          {/* Health Status */}
          {summary && (
            <div
              className={`mb-6 rounded-lg p-4 border ${getHealthBg(summary.dashboardHealth.status)}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-semibold ${getHealthColor(summary.dashboardHealth.status)}`}>
                    Dashboard Status: {summary.dashboardHealth.status.toUpperCase()}
                  </div>
                  <div className="text-sm text-slate-400 mt-2 space-y-1">
                    <div>
                      Response Time:{" "}
                      <span
                        className={
                          summary.dashboardHealth.responseTimeOk
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {summary.avgResponseTime}ms {summary.dashboardHealth.responseTimeOk ? "✓" : "✗"}
                      </span>
                    </div>
                    <div>
                      Error Rate:{" "}
                      <span
                        className={
                          summary.dashboardHealth.errorRateOk
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        &lt;0.1% {summary.dashboardHealth.errorRateOk ? "✓" : "✗"}
                      </span>
                    </div>
                    <div>
                      Memory:{" "}
                      <span
                        className={
                          summary.dashboardHealth.memoryOk ? "text-green-400" : "text-red-400"
                        }
                      >
                        &lt;1GB {summary.dashboardHealth.memoryOk ? "✓" : "✗"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current Metrics */}
          {current && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">Active Users</div>
                <div className="text-2xl font-bold text-white">{current.activeUsers}</div>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">TPS</div>
                <div className="text-2xl font-bold text-white">
                  {current.transactionsPerSecond.toFixed(2)}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">Response Time</div>
                <div className="text-2xl font-bold text-white">
                  {current.averageResponseTime.toFixed(0)}ms
                </div>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">Memory Usage</div>
                <div className="text-2xl font-bold text-white">
                  {current.peakMemory.toFixed(0)}MB
                </div>
              </div>
            </div>
          )}

          {/* Throughput */}
          {summary && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="font-semibold text-white mb-3">Throughput ({summary.timeframe})</div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Total Actions</div>
                  <div className="font-semibold">{summary.throughput.totalActionsProcessed}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Actions/sec</div>
                  <div className="font-semibold">{summary.throughput.actionsPerSecond}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Total Points</div>
                  <div className="font-semibold">
                    {Math.round(Number(summary.throughput.totalPointsAwarded) / 1000)}k
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Faucet Rate</div>
                  <div className="font-semibold">
                    {(Number(summary.throughput.faucetInteractionRate) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Peak Stats */}
          {summary && (
            <div className="mt-6 pt-6 border-t border-slate-700 text-sm">
              <div className="font-semibold text-slate-300 mb-3">Peak Performance</div>
              <div className="grid grid-cols-2 gap-3 text-slate-400">
                <div>
                  <span>Peak TPS:</span>
                  <span className="ml-2 font-semibold text-white">{summary.peakTps}</span>
                </div>
                <div>
                  <span>Peak Users:</span>
                  <span className="ml-2 font-semibold text-white">{summary.peakUsers}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
