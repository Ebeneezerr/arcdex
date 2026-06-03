"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount, useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { isValidAddress } from '../../lib/contractUtils';

interface YieldFarmingProps {
  yieldFarmAddress: string;
  tokenA: string;
  tokenB: string;
}

export function YieldFarming({ yieldFarmAddress, tokenA, tokenB }: YieldFarmingProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);
  const [userFarms, setUserFarms] = useState<any>({});
  const [farmStats, setFarmStats] = useState<any>({});
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedFarm, setSelectedFarm] = useState("tokenA");

  // Yield Farm ABI (simplified)
  const yieldFarmAbi = [
    "function deposit(uint256 farmId, uint256 amount) external",
    "function withdraw(uint256 farmId, uint256 amount) external",
    "function harvest(uint256 farmId) external",
    "function getUserFarmInfo(address user, uint256 farmId) external view returns (uint256 staked, uint256 rewards, uint256 lastHarvest)",
    "function getFarmStats(uint256 farmId) external view returns (uint256 totalStaked, uint256 rewardRate, uint256 apr)",
    "function getFarmCount() external view returns (uint256)",
  ];

  const erc20Abi = [
    "function balanceOf(address) external view returns (uint256)",
    "function allowance(address, address) external view returns (uint256)",
    "function approve(address, uint256) external returns (bool)",
    "function decimals() external view returns (uint8)",
  ];

  useEffect(() => {
    if (isConnected && address) {
      loadUserData();
      loadFarmStats();
    }
  }, [isConnected, address]);

  const loadUserData = async () => {
    if (!walletClient || !address) return;

    try {
      if (!isValidAddress(yieldFarmAddress)) {
        console.warn('YieldFarming: invalid contract address, skipping loadUserData', yieldFarmAddress);
        return;
      }

      const provider = new ethers.BrowserProvider(walletClient);
      const yieldFarmContract = new ethers.Contract(yieldFarmAddress, yieldFarmAbi, provider);

      const farmCount = await yieldFarmContract.getFarmCount();

      const userFarmData: any = {};
      for (let i = 0; i < Math.min(farmCount, 2); i++) {
        const farmInfo = await yieldFarmContract.getUserFarmInfo(address, i);
        userFarmData[i === 0 ? "tokenA" : "tokenB"] = {
          staked: ethers.formatEther(farmInfo[0]),
          rewards: ethers.formatEther(farmInfo[1]),
          lastHarvest: new Date(Number(farmInfo[2]) * 1000).toLocaleString(),
        };
      }

      setUserFarms(userFarmData);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadFarmStats = async () => {
    if (!walletClient) return;

    try {
      if (!isValidAddress(yieldFarmAddress)) {
        console.warn('YieldFarming: invalid contract address, skipping loadFarmStats', yieldFarmAddress);
        return;
      }

      const provider = new ethers.BrowserProvider(walletClient);
      const yieldFarmContract = new ethers.Contract(yieldFarmAddress, yieldFarmAbi, provider);

      const farmCount = await yieldFarmContract.getFarmCount();

      const farmData: any = {};
      for (let i = 0; i < Math.min(farmCount, 2); i++) {
        const stats = await yieldFarmContract.getFarmStats(i);
        farmData[i === 0 ? "tokenA" : "tokenB"] = {
          totalStaked: ethers.formatEther(stats[0]),
          rewardRate: ethers.formatEther(stats[1]),
          apr: Number(stats[2]) / 100,
        };
      }

      setFarmStats(farmData);
    } catch (error) {
      console.error("Error loading farm stats:", error);
    }
  };

  const handleDeposit = async () => {
    if (!walletClient || !address || !depositAmount) return;

    setIsLoading(true);
    try {
      if (!isValidAddress(yieldFarmAddress)) {
        alert('Yield farm contract address is missing or invalid');
        setIsLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(
        selectedFarm === "tokenA" ? tokenA : tokenB,
        erc20Abi,
        signer
      );

      const yieldFarmContract = new ethers.Contract(yieldFarmAddress, yieldFarmAbi, signer);

      // Approve token
      const amount = ethers.parseEther(depositAmount);
      const farmId = selectedFarm === "tokenA" ? 0 : 1;
      const approveTx = await tokenContract.approve(yieldFarmAddress, amount);
      await approveTx.wait();

      // Deposit
      const depositTx = await yieldFarmContract.deposit(farmId, amount);
      await depositTx.wait();

      setDepositAmount("");
      await loadUserData();
      await loadFarmStats();

      alert("Deposit successful!");
    } catch (error) {
      console.error("Deposit failed:", error);
      alert("Deposit failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!walletClient || !address || !withdrawAmount) return;

    setIsLoading(true);
    try {
      if (!isValidAddress(yieldFarmAddress)) {
        alert('Yield farm contract address is missing or invalid');
        setIsLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const yieldFarmContract = new ethers.Contract(yieldFarmAddress, yieldFarmAbi, signer);

      const amount = ethers.parseEther(withdrawAmount);
      const farmId = selectedFarm === "tokenA" ? 0 : 1;
      const withdrawTx = await yieldFarmContract.withdraw(farmId, amount);
      await withdrawTx.wait();

      setWithdrawAmount("");
      await loadUserData();
      await loadFarmStats();

      alert("Withdraw successful!");
    } catch (error) {
      console.error("Withdraw failed:", error);
      alert("Withdraw failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHarvest = async () => {
    if (!walletClient || !address) return;

    setIsLoading(true);
    try {
      if (!isValidAddress(yieldFarmAddress)) {
        alert('Yield farm contract address is missing or invalid');
        setIsLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const yieldFarmContract = new ethers.Contract(yieldFarmAddress, yieldFarmAbi, signer);

      const farmId = selectedFarm === "tokenA" ? 0 : 1;
      const harvestTx = await yieldFarmContract.harvest(farmId);
      await harvestTx.wait();

      await loadUserData();

      alert("Harvest successful!");
    } catch (error) {
      console.error("Harvest failed:", error);
      alert("Harvest failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Yield Farming</h2>
          <p className="text-gray-600 mb-4">Connect your wallet to access yield farming</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Yield Farming</h2>

      {/* Farm Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">TokenA Farm</h3>
          <div className="space-y-1 text-sm">
            <p>Total Staked: {farmStats.tokenA?.totalStaked || "0"} TokenA</p>
            <p>Reward Rate: {farmStats.tokenA?.rewardRate || "0"} TokenB/day</p>
            <p>APR: {farmStats.tokenA?.apr || 0}%</p>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">TokenB Farm</h3>
          <div className="space-y-1 text-sm">
            <p>Total Staked: {farmStats.tokenB?.totalStaked || "0"} TokenB</p>
            <p>Reward Rate: {farmStats.tokenB?.rewardRate || "0"} TokenB/day</p>
            <p>APR: {farmStats.tokenB?.apr || 0}%</p>
          </div>
        </div>
      </div>

      {/* User Positions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Your TokenA Farm</h3>
          <div className="space-y-1 text-sm">
            <p>Staked: {userFarms.tokenA?.staked || "0"} TokenA</p>
            <p>Rewards: {userFarms.tokenA?.rewards || "0"} TokenB</p>
            <p>Last Harvest: {userFarms.tokenA?.lastHarvest || "Never"}</p>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Your TokenB Farm</h3>
          <div className="space-y-1 text-sm">
            <p>Staked: {userFarms.tokenB?.staked || "0"} TokenB</p>
            <p>Rewards: {userFarms.tokenB?.rewards || "0"} TokenB</p>
            <p>Last Harvest: {userFarms.tokenB?.lastHarvest || "Never"}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Deposit */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Deposit</h3>
          <div className="space-y-4">
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="tokenA">TokenA Farm</option>
              <option value="tokenB">TokenB Farm</option>
            </select>
            <input
              type="number"
              placeholder="Amount to deposit"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleDeposit}
              disabled={isLoading || !depositAmount}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Depositing..." : "Deposit"}
            </button>
          </div>
        </div>

        {/* Withdraw */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Withdraw</h3>
          <div className="space-y-4">
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="tokenA">TokenA Farm</option>
              <option value="tokenB">TokenB Farm</option>
            </select>
            <input
              type="number"
              placeholder="Amount to withdraw"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleWithdraw}
              disabled={isLoading || !withdrawAmount}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {isLoading ? "Withdrawing..." : "Withdraw"}
            </button>
          </div>
        </div>

        {/* Harvest */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Harvest Rewards</h3>
          <div className="space-y-4">
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="tokenA">TokenA Farm</option>
              <option value="tokenB">TokenB Farm</option>
            </select>
            <div className="text-sm text-gray-600">
              <p>Rewards Available:</p>
              <p className="font-semibold">
                {userFarms[selectedFarm]?.rewards || "0"} TokenB
              </p>
            </div>
            <button
              onClick={handleHarvest}
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "Harvesting..." : "Harvest"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}