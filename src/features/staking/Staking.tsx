"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount, useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { astrodexConfig } from '../../lib/dexConfig';
import { deployments, defaultNetwork } from '../../lib/deployments';

const ZERO_ADDRESS_REGEX = /^0x0+$/i;

interface StakingProps {
  stakingRewardsAddress: string;
  tokenA: string;
  tokenB: string;
  tokenAName?: string;
  tokenASymbol?: string;
  tokenBName?: string;
  tokenBSymbol?: string;
}

export function Staking({ stakingRewardsAddress, tokenA, tokenB, tokenAName, tokenASymbol, tokenBName, tokenBSymbol }: StakingProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);
  const [userStake, setUserStake] = useState<any>({});
  const [poolStats, setPoolStats] = useState<any>({});
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("tokenA");

  const deploymentContracts = deployments[defaultNetwork]?.contracts || {};
  const deploymentTokens = deployments[defaultNetwork]?.tokens || [];
  const resolvedStakingAddress =
    stakingRewardsAddress ||
    astrodexConfig.contracts?.stakingRewards ||
    astrodexConfig.contracts?.staking ||
    astrodexConfig.contracts?.yieldFarm ||
    deploymentContracts.stakeRewards ||
    deploymentContracts.stakingRewards ||
    deploymentContracts.staking ||
    deploymentContracts.yieldFarm ||
    '';
  const resolvedTokenA = tokenA || astrodexConfig.tokens?.[0]?.address || deploymentTokens[0]?.address || '';
  const resolvedTokenB = tokenB || astrodexConfig.tokens?.[1]?.address || deploymentTokens[1]?.address || '';
  const isStakingReady = !!resolvedStakingAddress && ethers.isAddress(resolvedStakingAddress) && !ZERO_ADDRESS_REGEX.test(resolvedStakingAddress);

  const selectStyle = {
    background: 'var(--color-surface, #0a0a1a)',
    color: 'var(--color-text-primary, #e0ffe0)',
    border: '1px solid var(--color-border, #003322)',
    borderRadius: '4px',
    padding: '8px 12px',
    width: '100%',
    cursor: 'pointer',
    appearance: 'none' as const
  };

  const inputStyle = {
    background: 'var(--color-surface, #0a0a1a)',
    color: 'var(--color-text-primary, #e0ffe0)',
    border: '1px solid var(--color-border, #003322)',
    borderRadius: '4px',
    padding: '8px 12px',
    width: '100%'
  };

  // Staking Rewards ABI (simplified)
  const stakingAbi = [
    "function stake(address token, uint256 amount) external",
    "function unstake(address token, uint256 amount) external",
    "function claimRewards() external",
    "function getUserStake(address user, address token) external view returns (uint256 staked, uint256 rewards)",
    "function getPoolStats(address token) external view returns (uint256 totalStaked, uint256 rewardRate)",
  ];

  const erc20Abi = [
    "function balanceOf(address) external view returns (uint256)",
    "function allowance(address, address) external view returns (uint256)",
    "function approve(address, uint256) external returns (bool)",
    "function decimals() external view returns (uint8)",
  ];

  useEffect(() => {
    if (isConnected && address && isStakingReady) {
      loadUserData();
      loadPoolStats();
    }
  }, [isConnected, address, isStakingReady]);

  const loadUserData = async () => {
    if (!walletClient || !address || !isStakingReady) return;

    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const stakingContract = new ethers.Contract(resolvedStakingAddress, stakingAbi, provider);

      const [tokenA_stake, tokenB_stake] = await Promise.all([
        stakingContract.getUserStake(address, resolvedTokenA),
        stakingContract.getUserStake(address, resolvedTokenB),
      ]);

      setUserStake({
        tokenA: {
          staked: ethers.formatEther(tokenA_stake[0]),
          rewards: ethers.formatEther(tokenA_stake[1]),
        },
        tokenB: {
          staked: ethers.formatEther(tokenB_stake[0]),
          rewards: ethers.formatEther(tokenB_stake[1]),
        },
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadPoolStats = async () => {
    if (!walletClient || !isStakingReady) return;

    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const stakingContract = new ethers.Contract(resolvedStakingAddress, stakingAbi, provider);

      const [tokenA_stats, tokenB_stats] = await Promise.all([
        stakingContract.getPoolStats(resolvedTokenA),
        stakingContract.getPoolStats(resolvedTokenB),
      ]);

      setPoolStats({
        tokenA: {
          totalStaked: ethers.formatEther(tokenA_stats[0]),
          rewardRate: ethers.formatEther(tokenA_stats[1]),
        },
        tokenB: {
          totalStaked: ethers.formatEther(tokenB_stats[0]),
          rewardRate: ethers.formatEther(tokenB_stats[1]),
        },
      });
    } catch (error) {
      console.error("Error loading pool stats:", error);
    }
  };

  const handleStake = async () => {
    if (!walletClient || !address || !stakeAmount || !isStakingReady) return;

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(
        selectedToken === "tokenA" ? resolvedTokenA : resolvedTokenB,
        erc20Abi,
        signer
      );

      const stakingContract = new ethers.Contract(resolvedStakingAddress, stakingAbi, signer);

      // Approve token
      const amount = ethers.parseEther(stakeAmount);
      const approveTx = await tokenContract.approve(resolvedStakingAddress, amount);
      await approveTx.wait();

      // Stake
      const stakeTx = await stakingContract.stake(
        selectedToken === "tokenA" ? resolvedTokenA : resolvedTokenB,
        amount
      );
      await stakeTx.wait();

      setStakeAmount("");
      await loadUserData();
      await loadPoolStats();

      alert("Stake successful!");
    } catch (error) {
      console.error("Stake failed:", error);
      alert("Stake failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!walletClient || !address || !unstakeAmount || !isStakingReady) return;

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const stakingContract = new ethers.Contract(resolvedStakingAddress, stakingAbi, signer);

      const amount = ethers.parseEther(unstakeAmount);
      const unstakeTx = await stakingContract.unstake(
        selectedToken === "tokenA" ? resolvedTokenA : resolvedTokenB,
        amount
      );
      await unstakeTx.wait();

      setUnstakeAmount("");
      await loadUserData();
      await loadPoolStats();

      alert("Unstake successful!");
    } catch (error) {
      console.error("Unstake failed:", error);
      alert("Unstake failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!walletClient || !address || !isStakingReady) return;

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const stakingContract = new ethers.Contract(resolvedStakingAddress, stakingAbi, signer);

      const claimTx = await stakingContract.claimRewards();
      await claimTx.wait();

      await loadUserData();

      alert("Rewards claimed!");
    } catch (error) {
      console.error("Claim failed:", error);
      alert("Claim failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const tokenALabel = tokenAName || 'TokenA';
  const tokenBLabel = tokenBName || 'TokenB';
  const tokenARewardLabel = tokenASymbol || tokenALabel;
  const tokenBRewardLabel = tokenBSymbol || tokenBLabel;

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Staking & Rewards</h2>
          <p className="text-gray-600 mb-4">Connect your wallet to access staking features</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (!isStakingReady) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Staking & Rewards</h2>
        <p className="text-sm text-gray-600">
          Staking module not deployed or contract address missing in config. Please ensure the deployment config includes a valid staking or yield farm address.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Staking & Rewards</h2>

      {/* Pool Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">{tokenALabel} Pool</h3>
          <div className="space-y-1 text-sm">
            <p>Total Staked: {poolStats.tokenA?.totalStaked || "0"} {tokenALabel}</p>
            <p>Reward Rate: {poolStats.tokenA?.rewardRate || "0"} {tokenARewardLabel}/day</p>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">{tokenBLabel} Pool</h3>
          <div className="space-y-1 text-sm">
            <p>Total Staked: {poolStats.tokenB?.totalStaked || "0"} {tokenBLabel}</p>
            <p>Reward Rate: {poolStats.tokenB?.rewardRate || "0"} {tokenBRewardLabel}/day</p>
          </div>
        </div>
      </div>

      {/* User Positions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Your {tokenALabel} Stake</h3>
          <div className="space-y-1 text-sm">
            <p>Staked: {userStake.tokenA?.staked || "0"} {tokenALabel}</p>
            <p>Rewards: {userStake.tokenA?.rewards || "0"} {tokenBLabel}</p>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Your {tokenBLabel} Stake</h3>
          <div className="space-y-1 text-sm">
            <p>Staked: {userStake.tokenB?.staked || "0"} {tokenBLabel}</p>
            <p>Rewards: {userStake.tokenB?.rewards || "0"} {tokenBLabel}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stake */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Stake</h3>
          <div className="space-y-4">
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              style={selectStyle}
            >
              <option value="tokenA">{tokenALabel}</option>
              <option value="tokenB">{tokenBLabel}</option>
            </select>
            <input
              type="number"
              placeholder="Amount to stake"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={handleStake}
              disabled={isLoading || !stakeAmount}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Staking..." : "Stake"}
            </button>
          </div>
        </div>

        {/* Unstake */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Unstake</h3>
          <div className="space-y-4">
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              style={selectStyle}
            >
              <option value="tokenA">{tokenALabel}</option>
              <option value="tokenB">{tokenBLabel}</option>
            </select>
            <input
              type="number"
              placeholder="Amount to unstake"
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={handleUnstake}
              disabled={isLoading || !unstakeAmount}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {isLoading ? "Unstaking..." : "Unstake"}
            </button>
          </div>
        </div>

        {/* Claim Rewards */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Claim Rewards</h3>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Total Rewards Available:</p>
              <p className="font-semibold">
                {(parseFloat(userStake.tokenA?.rewards || "0") + parseFloat(userStake.tokenB?.rewards || "0")).toFixed(4)} {tokenBLabel}
              </p>
            </div>
            <button
              onClick={handleClaimRewards}
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "Claiming..." : "Claim All Rewards"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}