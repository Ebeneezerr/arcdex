"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "@/lib/dashboardContext";

interface FaucetClaim {
  timestamp: number;
  date: string;
  points: string;
  module: string;
}

interface ClaimStats {
  totalClaims: number;
  totalPointsFromFaucet: string;
  averagePointsPerClaim: string;
  lastClaimTime: number | null;
  nextAvailableClaimTime: number;
}

export function FaucetClaimsWidget() {
  const { userAddress, error: dashboardError } = useDashboard();
  const [claimHistory, setClaimHistory] = useState<FaucetClaim[]>([]);
  const [claimStats, setClaimStats] = useState<ClaimStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysFilter, setDaysFilter] = useState(7);

  const fetchClaimHistory = async () => {
    if (!userAddress) {
      setError("User address not found");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/analytics/faucet-history?user=${userAddress}&days=${daysFilter}`
      );

      if (response.ok) {
        const data = await response.json();
        setClaimHistory(data.data.history);
        setClaimStats(data.data.claimStats);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch claim history");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimHistory();
    const interval = setInterval(fetchClaimHistory, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [userAddress, daysFilter]);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0 && minutes === 0) return "Just now";
    if (hours === 0) return `${minutes}m ago`;
    if (hours === 1) return "1h ago";
    return `${hours}h ago`;
  };

  return (
    <div className="bg-gradient-to-br from-amber-900 to-amber-950 rounded-lg p-6 border border-amber-800 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">🚰</span>
          Faucet Claim History
        </h3>
        <div className="text-sm text-amber-300">
          {claimStats ? `${claimStats.totalClaims} total claims` : "Loading..."}
        </div>
      </div>

      {/* Stats Summary */}
      {claimStats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-amber-800/50 rounded p-3">
            <div className="text-xs text-amber-300 mb-1">Total Claims</div>
            <div className="text-xl font-bold text-white">{claimStats.totalClaims}</div>
          </div>
          <div className="bg-amber-800/50 rounded p-3">
            <div className="text-xs text-amber-300 mb-1">Total Points</div>
            <div className="text-xl font-bold text-white">{claimStats.totalPointsFromFaucet}</div>
          </div>
          <div className="bg-amber-800/50 rounded p-3">
            <div className="text-xs text-amber-300 mb-1">Avg Per Claim</div>
            <div className="text-xl font-bold text-white">{claimStats.averagePointsPerClaim}</div>
          </div>
        </div>
      )}

      {/* Time Filter */}
      <div className="flex gap-2 mb-4">
        {[7, 30, 90].map((days) => (
          <button
            key={days}
            onClick={() => setDaysFilter(days)}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              daysFilter === days
                ? "bg-amber-600 text-white"
                : "bg-amber-800/50 text-amber-300 hover:bg-amber-700/50"
            }`}
          >
            {days}d
          </button>
        ))}
      </div>

      {/* History List */}
      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4 text-amber-300">Loading claim history...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-400">{error}</div>
        ) : claimHistory.length === 0 ? (
          <div className="text-center py-4 text-amber-300">No claims in this period</div>
        ) : (
          <div className="space-y-2">
            {claimHistory.map((claim, idx) => (
              <div
                key={idx}
                className="bg-amber-800/30 rounded p-3 flex justify-between items-center hover:bg-amber-800/50 transition-all"
              >
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{claim.points} points</div>
                  <div className="text-xs text-amber-300">{formatTime(claim.timestamp)}</div>
                </div>
                <div className="text-xs text-amber-400 bg-amber-950 px-2 py-1 rounded">
                  {new Date(claim.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last Claim Info */}
      {claimStats && claimStats.lastClaimTime && (
        <div className="mt-4 pt-4 border-t border-amber-700">
          <div className="text-xs text-amber-300">
            Last claim: {new Date(claimStats.lastClaimTime).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
