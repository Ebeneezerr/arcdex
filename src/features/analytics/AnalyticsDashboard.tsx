"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/lib/dashboardContext";
import { AggregatedMetrics } from "@/lib/metricsAggregator";
import { FaucetWidget } from "./FaucetWidget";
import { PointsDisplay } from "./PointsDisplay";
import { ModuleMetrics } from "./ModuleMetrics";
import { AbuseAlerts } from "./AbuseAlerts";

export function AnalyticsDashboard() {
  const { userAddress, isConnected, aggregatedMetrics, refreshMetrics, error } = useDashboard();
  const [globalMetrics, setGlobalMetrics] = useState<AggregatedMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (aggregatedMetrics) {
      setGlobalMetrics(aggregatedMetrics);
    }
  }, [aggregatedMetrics]);

  useEffect(() => {
    const interval = setInterval(async () => {
      setIsLoading(true);
      try {
        await refreshMetrics();
      } catch (error) {
        console.error("Error refreshing metrics:", error);
      } finally {
        setIsLoading(false);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [refreshMetrics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="text-5xl">📊</span>
            AstroDEX Analytics Dashboard
          </h1>
          <p className="text-slate-300">
            Real-time metrics, faucet claims, and module rewards tracking
          </p>

          {/* Connection Status */}
          <div className="mt-4 flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            ></div>
            <span className="text-sm text-slate-300">
              {isConnected ? "Connected to Network" : "Disconnected"}
            </span>
            {isLoading && <span className="text-xs text-slate-400">(Refreshing...)</span>}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-3 bg-red-900/30 border border-red-700 rounded p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Global Metrics Summary */}
        {globalMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-lg p-4 border border-blue-800">
              <div className="text-sm text-blue-300 mb-1">Active Users</div>
              <div className="text-2xl font-bold text-blue-100">
                {globalMetrics.totalUsersActive}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-lg p-4 border border-green-800">
              <div className="text-sm text-green-300 mb-1">Total Points Awarded</div>
              <div className="text-2xl font-bold text-green-100">
                {(BigInt(globalMetrics.totalPointsAwarded) / BigInt(1000)).toLocaleString()}k
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-900 to-yellow-950 rounded-lg p-4 border border-yellow-800">
              <div className="text-sm text-yellow-300 mb-1">Faucet Claims (Today)</div>
              <div className="text-2xl font-bold text-yellow-100">
                {globalMetrics.faucetClaimsToday}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900 to-purple-950 rounded-lg p-4 border border-purple-800">
              <div className="text-sm text-purple-300 mb-1">Avg Reputation</div>
              <div className="text-2xl font-bold text-purple-100">
                {(BigInt(globalMetrics.avgReputationScore) / BigInt(100)).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Faucet Widget */}
            {userAddress && <FaucetWidget />}

            {/* Module Metrics */}
            {userAddress && <ModuleMetrics />}

            {/* Top Users */}
            {globalMetrics?.topUsers && globalMetrics.topUsers.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-lg p-6 border border-indigo-800 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  Leaderboard
                </h3>

                <div className="space-y-2">
                  {globalMetrics.topUsers.slice(0, 5).map((user, idx) => (
                    <div key={user.userAddress} className="bg-indigo-800/30 rounded p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-indigo-300 min-w-[2rem] text-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-indigo-100 font-mono">
                            {user.userAddress.slice(0, 6)}...{user.userAddress.slice(-4)}
                          </div>
                          <div className="text-xs text-indigo-300">
                            Rep: {(BigInt(user.reputationScore) / BigInt(100)).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-indigo-100">
                          {(BigInt(user.lifetimePoints) / BigInt(1000)).toLocaleString()}k
                        </div>
                        <div className="text-xs text-indigo-400">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Points Display */}
            {userAddress && <PointsDisplay />}

            {/* Abuse Alerts */}
            {userAddress && <AbuseAlerts />}

            {/* Info Card */}
            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg p-4 border border-blue-700/50">
              <h4 className="font-semibold text-blue-200 mb-2">📚 How It Works</h4>
              <ul className="text-xs text-blue-300 space-y-1">
                <li>• Claim tokens daily for instant points</li>
                <li>• Earn bonus points from module interactions</li>
                <li>• Build reputation through consistent activity</li>
                <li>• Track your progress in real-time</li>
                <li>• Avoid multi-wallet abuse penalties</li>
              </ul>
            </div>

            {/* Last Update */}
            <div className="text-center text-xs text-slate-400 mt-auto">
              Real-time updates every 5 seconds
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
