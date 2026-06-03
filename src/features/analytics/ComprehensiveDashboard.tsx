"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "@/lib/dashboardContext";
import { AggregatedMetrics } from "@/lib/metricsAggregator";
import { FaucetWidget } from "./FaucetWidget";
import { FaucetClaimsWidget } from "./FaucetClaimsWidget";
import { PointsDisplay } from "./PointsDisplay";
import { ModuleMetrics } from "./ModuleMetrics";
import { ModuleMetricsWidget } from "./ModuleMetricsWidget";
import { ModuleHealthPanel } from "./ModuleHealthPanel";
import { AbuseAlerts } from "./AbuseAlerts";
import { StressTestMonitor } from "./StressTestMonitor";
import { RegressionTestMonitor } from "./RegressionTestMonitor";

type ViewType =
  | "overview"
  | "faucet"
  | "modules"
  | "abuse"
  | "stress"
  | "regression";

export function ComprehensiveDashboard() {
  const { userAddress, isConnected, aggregatedMetrics, refreshMetrics, error } = useDashboard();
  const [globalMetrics, setGlobalMetrics] = useState<AggregatedMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>("overview");

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
            Real-time metrics, faucet claims, module rewards, and system monitoring
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

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveView("overview")}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeView === "overview"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveView("faucet")}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeView === "faucet"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            🚰 Faucet
          </button>
          <button
            onClick={() => setActiveView("modules")}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeView === "modules"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            📈 Modules
          </button>
          <button
            onClick={() => setActiveView("abuse")}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeView === "abuse"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            🛡️ Abuse Prevention
          </button>
          <button
            onClick={() => setActiveView("stress")}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeView === "stress"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            ⚡ Stress Testing
          </button>
          <button
            onClick={() => setActiveView("regression")}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeView === "regression"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            🧪 Regression
          </button>
        </div>

        {/* Global Metrics Summary (Always Visible) */}
        {globalMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-lg p-4 border border-blue-800">
              <div className="text-sm text-blue-300 mb-1">Active Users</div>
              <div className="text-2xl font-bold text-blue-100">{globalMetrics.totalUsersActive}</div>
            </div>

            <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-lg p-4 border border-green-800">
              <div className="text-sm text-green-300 mb-1">Total Points</div>
              <div className="text-2xl font-bold text-green-100">
                {(BigInt(globalMetrics.totalPointsAwarded) / 1000n).toString()}k
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-900 to-amber-950 rounded-lg p-4 border border-amber-800">
              <div className="text-sm text-amber-300 mb-1">Faucet Claims Today</div>
              <div className="text-2xl font-bold text-amber-100">{globalMetrics.faucetClaimsToday}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-900 to-purple-950 rounded-lg p-4 border border-purple-800">
              <div className="text-sm text-purple-300 mb-1">Avg Reputation</div>
              <div className="text-2xl font-bold text-purple-100">
                {Number(globalMetrics.avgReputationScore)}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 mb-8">
          <ModuleHealthPanel />
          <div className="space-y-6">
            <div className="bg-slate-900/80 rounded-lg p-6 border border-slate-700 shadow-lg">
              <h2 className="text-sm uppercase tracking-widest text-slate-500 mb-4">Verification Overview</h2>
              <p className="text-slate-400">This panel tracks deployment verification alongside module analytics so the DEX remains self-aware and operationally healthy.</p>
            </div>
            <div className="bg-slate-900/80 rounded-lg p-6 border border-slate-700 shadow-lg">
              <h2 className="text-sm uppercase tracking-widest text-slate-500 mb-4">Event Subscriptions</h2>
              <p className="text-slate-400">Enabled module event sources are derived from runtime metadata and auto-subscribed by the analytics listener.</p>
            </div>
          </div>
        </div>

        {/* Content Based on Active View */}
        <div className="space-y-8">
          {/* Overview View */}
          {activeView === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PointsDisplay />
              <ModuleMetrics />
              <FaucetWidget />
              <AbuseAlerts />
            </div>
          )}

          {/* Faucet View */}
          {activeView === "faucet" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FaucetWidget />
              <FaucetClaimsWidget />
            </div>
          )}

          {/* Modules View */}
          {activeView === "modules" && (
            <div>
              <ModuleMetricsWidget />
            </div>
          )}

          {/* Abuse Prevention View */}
          {activeView === "abuse" && (
            <div>
              <AbuseAlerts />
            </div>
          )}

          {/* Stress Testing View */}
          {activeView === "stress" && (
            <div>
              <StressTestMonitor />
            </div>
          )}

          {/* Regression Testing View */}
          {activeView === "regression" && (
            <div>
              <RegressionTestMonitor />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-700 text-center text-slate-400 text-sm">
          <p>Last updated: {new Date().toLocaleTimeString()}</p>
          <p className="mt-2">
            AstroDEX DEX Analytics • Real-time on-chain data synchronized every 5 seconds
          </p>
        </div>
      </div>
    </div>
  );
}