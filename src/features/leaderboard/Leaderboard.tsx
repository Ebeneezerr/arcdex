"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import PointsTrackerAbi from "../../contracts/abis/shared/PointsTracker.sol/PointsTracker.json";
import { isValidAddress } from '../../lib/contractUtils';

const DEFAULT_RPC_URL = "https://rpc.testnet.arc.network";
const DEFAULT_POINTS_TRACKER_ADDRESS = "0x97c18678914B627aEaA9920e85e2E8f6B4CA5F74";
const REFRESH_INTERVAL_MS = 30 * 1000;

interface LeaderboardProps {
  pointsTrackerAddress?: string;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  points: string;
}

function shortenAddress(address: string): string {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Leaderboard({ pointsTrackerAddress }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = useMemo(
    () => pointsTrackerAddress || DEFAULT_POINTS_TRACKER_ADDRESS,
    [pointsTrackerAddress]
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const loadLeaderboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const provider = new ethers.JsonRpcProvider(DEFAULT_RPC_URL, {
          name: "arcTestnet",
          chainId: 5042002,
        });

        if (!isValidAddress(contractAddress)) {
          console.warn('Leaderboard: invalid pointsTracker address', contractAddress);
          setError('Invalid PointsTracker contract address');
          setIsLoading(false);
          return;
        }

        const tracker = new ethers.Contract(
          contractAddress,
          PointsTrackerAbi.abi,
          provider
        );

        const result = await tracker.getLeaderboard(10);
        const users: string[] = result?.users || [];
        const points: (string | number | bigint)[] = result?.points || [];

        const rows = users.map((user, index) => ({
          rank: index + 1,
          address: user,
          points: ethers.formatUnits(points[index] ?? 0, 0),
        }));

        setEntries(rows);
      } catch (err) {
        console.error("Leaderboard load failed", err);
        setError("Unable to load leaderboard. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
    interval = setInterval(loadLeaderboard, REFRESH_INTERVAL_MS);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [contractAddress]);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-6 text-slate-100">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Leaderboard</h2>
          <p className="text-sm text-slate-400">Top 10 PointsTracker accounts on Arc Testnet.</p>
        </div>
        <div className="text-sm text-slate-400">Refreshes every 30s</div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-rose-950/70 p-4 text-sm text-rose-200">{error}</div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-[48px_1fr_120px] gap-4 text-xs uppercase tracking-[0.24em] text-slate-500 px-2">
            <span>#</span>
            <span>Address</span>
            <span className="text-right">Points</span>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-slate-900 p-6 text-center text-slate-400">Loading leaderboard...</div>
          ) : entries.length === 0 ? (
            <div className="rounded-2xl bg-slate-900 p-6 text-center text-slate-400">No leaderboard entries available.</div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.address}
                className="grid grid-cols-[48px_1fr_120px] gap-4 items-center rounded-3xl bg-slate-900 p-3 text-sm text-slate-200"
              >
                <span className="font-semibold text-sky-400">{entry.rank}</span>
                <span>{shortenAddress(entry.address)}</span>
                <span className="text-right font-mono text-slate-100">{entry.points}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
