"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "@/lib/dashboardContext";

export function FaucetWidget() {
  const { userMetrics, claimFaucet, error } = useDashboard();
  const [isClaiming, setIsClaiming] = useState(false);
  const [lastClaim, setLastClaim] = useState<Date | null>(null);
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState<number>(0);

  useEffect(() => {
    // Calculate time until next faucet claim available
    if (userMetrics && userMetrics.dailyFaucetClaims >= 5) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      setTimeUntilNextClaim(Math.ceil(diff / 1000));

      const interval = setInterval(() => {
        setTimeUntilNextClaim((prev) => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [userMetrics?.dailyFaucetClaims]);

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      // In production, this would call the actual claim function
      await claimFaucet("tokenA");
      setLastClaim(new Date());
    } catch (err) {
      console.error("Error claiming faucet:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  const dailyClaimsRemaining = 5 - (userMetrics?.dailyFaucetClaims || 0);
  const canClaim = dailyClaimsRemaining > 0;

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "Ready";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-lg p-6 border border-blue-800 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">🚰</span>
          Daily Faucet
        </h3>
        <span className="px-3 py-1 bg-blue-800 rounded-full text-sm text-blue-100">
          {dailyClaimsRemaining}/{5} remaining
        </span>
      </div>

      <div className="space-y-3">
        {/* Claims Progress */}
        <div className="bg-blue-800/50 rounded p-3">
          <div className="text-sm text-blue-200 mb-2">Daily Claim Progress</div>
          <div className="w-full bg-blue-950 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                canClaim ? "bg-green-500" : "bg-red-500"
              }`}
              style={{
                width: `${((5 - dailyClaimsRemaining) / 5) * 100}%`,
              }}
            ></div>
          </div>
          <div className="text-xs text-blue-300 mt-2">
            {userMetrics?.dailyFaucetClaims || 0} claims today
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={!canClaim || isClaiming}
          className={`w-full py-2 px-4 rounded font-semibold transition-all ${
            canClaim
              ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          } ${isClaiming ? "opacity-50" : ""}`}
        >
          {isClaiming ? "Claiming..." : canClaim ? "Claim Tokens" : "Daily Limit Reached"}
        </button>

        {/* Next Claim Info */}
        {!canClaim && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded p-2 text-xs text-yellow-200">
            <strong>Next claim in:</strong> {formatTime(timeUntilNextClaim)}
          </div>
        )}

        {/* Last Claim */}
        {lastClaim && (
          <div className="text-xs text-blue-300 text-center">
            Last claim: {lastClaim.toLocaleTimeString()}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded p-2 text-xs text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
