"use client";

import { useState, useEffect } from "react";

interface TestResult {
  id: string;
  name: string;
  testType: string;
  status: "passed" | "failed" | "warning";
  timestamp: string;
  assertionPassRate: string;
  details: string;
  errorMessage?: string;
}

interface RegressionStats {
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  successRate: string;
  avgAssertionPassRate: string;
  testTypeBreakdown: Record<string, number>;
}

interface LiveValidationChecks {
  usersWithPoints: number;
  usersWithReputation: number;
  averagePointsPerUser: string;
  usersWithModuleParticipation: number;
  faucetUsageRate: string;
}

export function RegressionTestMonitor() {
  const [stats, setStats] = useState<RegressionStats | null>(null);
  const [liveChecks, setLiveChecks] = useState<LiveValidationChecks | null>(null);
  const [recentResults, setRecentResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const fetchRegressionTests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ days: days.toString() });
      if (selectedType) params.append("type", selectedType);

      const response = await fetch(`/api/analytics/regression-tests?${params}`);

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.statistics);
        setLiveChecks(data.data.liveValidationChecks);
        setRecentResults(data.data.recentResults);
      } else {
        setError("Failed to fetch regression test results");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegressionTests();
    const interval = setInterval(fetchRegressionTests, 120000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, [days, selectedType]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "text-green-400 bg-green-900/20";
      case "failed":
        return "text-red-400 bg-red-900/20";
      case "warning":
        return "text-yellow-400 bg-yellow-900/20";
      default:
        return "text-gray-400 bg-gray-900/20";
    }
  };

  const getTestTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      faucet_claim: "from-amber-700 to-amber-800",
      module_interaction: "from-blue-700 to-blue-800",
      multi_wallet: "from-purple-700 to-purple-800",
      reputation_decay: "from-red-700 to-red-800",
      quality_factor: "from-green-700 to-green-800",
      diversity_bonus: "from-pink-700 to-pink-800",
    };
    return colors[type] || "from-gray-700 to-gray-800";
  };

  const testTypeNames: Record<string, string> = {
    faucet_claim: "🚰 Faucet Claims",
    module_interaction: "📊 Module Interactions",
    multi_wallet: "👛 Multi-Wallet",
    reputation_decay: "📉 Reputation Decay",
    quality_factor: "⚡ Quality Factor",
    diversity_bonus: "🎁 Diversity Bonus",
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-6 border border-slate-800 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">🧪</span>
          Regression Testing
        </h3>
        <button
          onClick={fetchRegressionTests}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition-all"
        >
          Refresh
        </button>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2 mb-6">
        {[1, 7, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              days === d
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-slate-400">Loading regression tests...</div>
      ) : error ? (
        <div className="text-center py-6 text-red-400">{error}</div>
      ) : (
        <>
          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">Success Rate</div>
                <div className="text-2xl font-bold text-green-400">{stats.successRate}%</div>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">Assertion Pass Rate</div>
                <div className="text-2xl font-bold text-blue-400">
                  {stats.avgAssertionPassRate}%
                </div>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">Total Tests</div>
                <div className="text-2xl font-bold text-white">{stats.totalTests}</div>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-xs text-slate-400 mb-1">Failed Tests</div>
                <div className={`text-2xl font-bold ${stats.failed > 0 ? "text-red-400" : "text-green-400"}`}>
                  {stats.failed}
                </div>
              </div>
            </div>
          )}

          {/* Live Validation Checks */}
          {liveChecks && (
            <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
              <div className="font-semibold text-white mb-3">Live Validation Checks</div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Users w/ Points</div>
                  <div className="font-semibold text-green-400">{liveChecks.usersWithPoints}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Users w/ Reputation</div>
                  <div className="font-semibold text-blue-400">
                    {liveChecks.usersWithReputation}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Avg Points/User</div>
                  <div className="font-semibold text-amber-400">
                    {Math.round(Number(liveChecks.averagePointsPerUser))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Faucet Usage Rate</div>
                  <div className="font-semibold text-purple-400">
                    {liveChecks.faucetUsageRate}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test Type Filter */}
          {stats && Object.keys(stats.testTypeBreakdown).length > 0 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedType(null)}
                className={`px-3 py-1 rounded text-sm whitespace-nowrap font-medium transition-all ${
                  selectedType === null
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                All Tests
              </button>
              {Object.entries(stats.testTypeBreakdown).map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 rounded text-sm whitespace-nowrap font-medium transition-all ${
                    selectedType === type
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {testTypeNames[type] || type} ({count})
                </button>
              ))}
            </div>
          )}

          {/* Recent Test Results */}
          <div className="mb-6">
            <div className="font-semibold text-white mb-3">Recent Test Results</div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {recentResults.length === 0 ? (
                <div className="text-center py-4 text-slate-400">No tests found</div>
              ) : (
                recentResults.map((result) => (
                  <div
                    key={result.id}
                    className={`rounded-lg p-3 border-l-4 ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{result.name}</div>
                        <div className="text-xs opacity-75 mt-1">{result.testType}</div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="font-semibold text-xs">
                          {result.assertionPassRate}% pass
                        </div>
                        <div className="text-xs opacity-75">
                          {new Date(result.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {result.errorMessage && (
                      <div className="text-xs text-red-400 mt-2 bg-red-900/20 p-2 rounded">
                        {result.errorMessage}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
