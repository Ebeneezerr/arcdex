"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount, useWalletClient } from "wagmi";
import { isValidAddress } from '../../lib/contractUtils';
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface CopyTradingProps {
  copyTradingAddress: string;
  tokenA: string;
  tokenB: string;
}

interface Trader {
  address: string;
  totalFollowers: number;
  totalVolume: string;
  winRate: number;
  currentFollowers: number;
}

export function CopyTrading({ copyTradingAddress, tokenA, tokenB }: CopyTradingProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [userFollowing, setUserFollowing] = useState<string[]>([]);
  const [selectedTrader, setSelectedTrader] = useState("");
  const [followAmount, setFollowAmount] = useState("");

  // Copy Trading ABI (simplified)
  const copyTradingAbi = [
    "function followTrader(address trader, uint256 amount) external",
    "function unfollowTrader(address trader) external",
    "function executeTrade(address trader, address tokenIn, address tokenOut, uint256 amountIn) external",
    "function getTopTraders() external view returns (address[] memory)",
    "function getTraderStats(address trader) external view returns (uint256 totalFollowers, uint256 totalVolume, uint256 winRate)",
    "function getUserFollowing(address user) external view returns (address[] memory)",
    "function getTraderFollowers(address trader) external view returns (address[] memory)",
  ];

  const erc20Abi = [
    "function balanceOf(address) external view returns (uint256)",
    "function allowance(address, address) external view returns (uint256)",
    "function approve(address, uint256) external returns (bool)",
    "function decimals() external view returns (uint8)",
  ];

  useEffect(() => {
    if (isConnected && address) {
      loadTraders();
      loadUserFollowing();
    }
  }, [isConnected, address]);

  const loadTraders = async () => {
    if (!walletClient) return;

    try {
      if (!isValidAddress(copyTradingAddress)) {
        console.warn('CopyTrading: invalid contract address, skipping loadTraders', copyTradingAddress);
        return;
      }
      const provider = new ethers.BrowserProvider(walletClient);
      const copyTradingContract = new ethers.Contract(copyTradingAddress, copyTradingAbi, provider);

      const traderAddresses = await copyTradingContract.getTopTraders();

      const traderData: Trader[] = [];
      for (const traderAddr of traderAddresses.slice(0, 10)) {
        const stats = await copyTradingContract.getTraderStats(traderAddr);
        const followers = await copyTradingContract.getTraderFollowers(traderAddr);

        traderData.push({
          address: traderAddr,
          totalFollowers: followers.length,
          totalVolume: ethers.formatEther(stats[1]),
          winRate: Number(stats[2]) / 100,
          currentFollowers: followers.length,
        });
      }

      setTraders(traderData);
    } catch (error) {
      console.error("Error loading traders:", error);
    }
  };

  const loadUserFollowing = async () => {
    if (!walletClient || !address) return;

    try {
      if (!isValidAddress(copyTradingAddress)) {
        console.warn('CopyTrading: invalid contract address, skipping loadUserFollowing', copyTradingAddress);
        return;
      }
      const provider = new ethers.BrowserProvider(walletClient);
      const copyTradingContract = new ethers.Contract(copyTradingAddress, copyTradingAbi, provider);

      const following = await copyTradingContract.getUserFollowing(address);
      setUserFollowing(following);
    } catch (error) {
      console.error("Error loading user following:", error);
    }
  };

  const handleFollow = async () => {
    if (!walletClient || !address || !selectedTrader || !followAmount) return;

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(tokenA, erc20Abi, signer);
      if (!isValidAddress(copyTradingAddress)) {
        alert('CopyTrading contract address is missing or invalid');
        setIsLoading(false);
        return;
      }
      const copyTradingContract = new ethers.Contract(copyTradingAddress, copyTradingAbi, signer);

      // Approve token
      const amount = ethers.parseEther(followAmount);
      const approveTx = await tokenContract.approve(copyTradingAddress, amount);
      await approveTx.wait();

      // Follow trader
      const followTx = await copyTradingContract.followTrader(selectedTrader, amount);
      await followTx.wait();

      setFollowAmount("");
      await loadUserFollowing();

      alert("Successfully following trader!");
    } catch (error) {
      console.error("Follow failed:", error);
      alert("Follow failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async (traderAddress: string) => {
    if (!walletClient || !address) return;

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      if (!isValidAddress(copyTradingAddress)) {
        alert('CopyTrading contract address is missing or invalid');
        setIsLoading(false);
        return;
      }
      const copyTradingContract = new ethers.Contract(copyTradingAddress, copyTradingAbi, signer);

      const unfollowTx = await copyTradingContract.unfollowTrader(traderAddress);
      await unfollowTx.wait();

      await loadUserFollowing();

      alert("Successfully unfollowed trader!");
    } catch (error) {
      console.error("Unfollow failed:", error);
      alert("Unfollow failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Copy Trading</h2>
          <p className="text-gray-600 mb-4">Connect your wallet to access copy trading features</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Copy Trading</h2>

      {/* Follow Trader */}
      <div className="border rounded-lg p-4 mb-8">
        <h3 className="font-semibold mb-4">Follow a Trader</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={selectedTrader}
            onChange={(e) => setSelectedTrader(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Select Trader</option>
            {traders.map((trader) => (
              <option key={trader.address} value={trader.address}>
                {trader.address.slice(0, 6)}...{trader.address.slice(-4)} ({trader.winRate}% win rate)
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Amount to allocate"
            value={followAmount}
            onChange={(e) => setFollowAmount(e.target.value)}
            className="p-2 border rounded"
          />
          <button
            onClick={handleFollow}
            disabled={isLoading || !selectedTrader || !followAmount}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Following..." : "Follow Trader"}
          </button>
        </div>
      </div>

      {/* Traders List */}
      <div className="mb-8">
        <h3 className="font-semibold mb-4">Top Traders</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {traders.map((trader) => {
            const isFollowing = userFollowing.includes(trader.address);
            return (
              <div key={trader.address} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-sm">
                    {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
                  </div>
                  {isFollowing && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Following
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <p>Followers: {trader.totalFollowers}</p>
                  <p>Volume: {parseFloat(trader.totalVolume).toFixed(2)} TokenA</p>
                  <p>Win Rate: {trader.winRate}%</p>
                </div>
                {isFollowing ? (
                  <button
                    onClick={() => handleUnfollow(trader.address)}
                    disabled={isLoading}
                    className="w-full mt-3 bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    Unfollow
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedTrader(trader.address)}
                    className="w-full mt-3 bg-gray-600 text-white py-1 px-3 rounded text-sm hover:bg-gray-700"
                  >
                    Select to Follow
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Following List */}
      {userFollowing.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">Traders You're Following</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userFollowing.map((traderAddr) => {
              const trader = traders.find((t) => t.address === traderAddr);
              return (
                <div key={traderAddr} className="border rounded-lg p-4 bg-blue-50">
                  <div className="font-mono text-sm mb-2">
                    {traderAddr.slice(0, 6)}...{traderAddr.slice(-4)}
                  </div>
                  {trader && (
                    <div className="space-y-1 text-sm">
                      <p>Win Rate: {trader.winRate}%</p>
                      <p>Volume: {parseFloat(trader.totalVolume).toFixed(2)} TokenA</p>
                    </div>
                  )}
                  <button
                    onClick={() => handleUnfollow(traderAddr)}
                    disabled={isLoading}
                    className="w-full mt-3 bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    Unfollow
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}