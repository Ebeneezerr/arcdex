"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { isValidAddress } from '../../lib/contractUtils';
import { useAccount, useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface LendingProps {
  lendingPoolAddress: string;
  tokenA: string;
  tokenB: string;
}

export function Lending({ lendingPoolAddress, tokenA, tokenB }: LendingProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(false);
  const [userDeposits, setUserDeposits] = useState<any>({});
  const [poolStats, setPoolStats] = useState<any>({});
  const [depositAmount, setDepositAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("tokenA");

  // Lending Pool ABI (simplified)
  const lendingPoolAbi = [
    "function deposit(address token, uint256 amount) external",
    "function withdraw(address token, uint256 amount) external",
    "function borrow(address token, uint256 amount) external",
    "function repay(address token, uint256 amount) external",
    "function getUserDeposit(address user, address token) external view returns (uint256)",
    "function getUserBorrow(address user, address token) external view returns (uint256)",
    "function getPoolStats(address token) external view returns (uint256 totalDeposits, uint256 totalBorrows, uint256 utilizationRate)",
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
      loadPoolStats();
    }
  }, [isConnected, address]);

  const loadUserData = async () => {
    if (!walletClient || !address) return;

    try {
      if (!isValidAddress(lendingPoolAddress)) {
        console.warn('Lending: invalid lendingPoolAddress, skipping loadUserData', lendingPoolAddress);
        return;
      }
      const provider = new ethers.BrowserProvider(walletClient);
      const lendingContract = new ethers.Contract(lendingPoolAddress, lendingPoolAbi, provider);

      const [tokenA_deposit, tokenA_borrow, tokenB_deposit, tokenB_borrow] = await Promise.all([
        lendingContract.getUserDeposit(address, tokenA),
        lendingContract.getUserBorrow(address, tokenA),
        lendingContract.getUserDeposit(address, tokenB),
        lendingContract.getUserBorrow(address, tokenB),
      ]);

      setUserDeposits({
        tokenA: {
          deposit: ethers.formatEther(tokenA_deposit),
          borrow: ethers.formatEther(tokenA_borrow),
        },
        tokenB: {
          deposit: ethers.formatEther(tokenB_deposit),
          borrow: ethers.formatEther(tokenB_borrow),
        },
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadPoolStats = async () => {
    if (!walletClient) return;

    try {
      if (!isValidAddress(lendingPoolAddress)) {
        console.warn('Lending: invalid lendingPoolAddress, skipping loadPoolStats', lendingPoolAddress);
        return;
      }
      const provider = new ethers.BrowserProvider(walletClient);
      const lendingContract = new ethers.Contract(lendingPoolAddress, lendingPoolAbi, provider);

      const [tokenA_stats, tokenB_stats] = await Promise.all([
        lendingContract.getPoolStats(tokenA),
        lendingContract.getPoolStats(tokenB),
      ]);

      setPoolStats({
        tokenA: {
          totalDeposits: ethers.formatEther(tokenA_stats[0]),
          totalBorrows: ethers.formatEther(tokenA_stats[1]),
          utilizationRate: Number(tokenA_stats[2]) / 100,
        },
        tokenB: {
          totalDeposits: ethers.formatEther(tokenB_stats[0]),
          totalBorrows: ethers.formatEther(tokenB_stats[1]),
          utilizationRate: Number(tokenB_stats[2]) / 100,
        },
      });
    } catch (error) {
      console.error("Error loading pool stats:", error);
    }
  };

  const handleDeposit = async () => {
    if (!walletClient || !address || !depositAmount) return;

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(
        selectedToken === "tokenA" ? tokenA : tokenB,
        erc20Abi,
        signer
      );
      if (!isValidAddress(lendingPoolAddress)) {
        alert('Lending pool contract address is missing or invalid');
        setIsLoading(false);
        return;
      }
      const lendingContract = new ethers.Contract(lendingPoolAddress, lendingPoolAbi, signer);

      // Approve token
      const amount = ethers.parseEther(depositAmount);
      const approveTx = await tokenContract.approve(lendingPoolAddress, amount);
      await approveTx.wait();

      // Deposit
      const depositTx = await lendingContract.deposit(
        selectedToken === "tokenA" ? tokenA : tokenB,
        amount
      );
      await depositTx.wait();

      setDepositAmount("");
      await loadUserData();
      await loadPoolStats();

      alert("Deposit successful!");
    } catch (error) {
      console.error("Deposit failed:", error);
      alert("Deposit failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!walletClient || !address || !borrowAmount) return;

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const lendingContract = new ethers.Contract(lendingPoolAddress, lendingPoolAbi, signer);

      const amount = ethers.parseEther(borrowAmount);
      const borrowTx = await lendingContract.borrow(
        selectedToken === "tokenA" ? tokenA : tokenB,
        amount
      );
      await borrowTx.wait();

      setBorrowAmount("");
      await loadUserData();
      await loadPoolStats();

      alert("Borrow successful!");
    } catch (error) {
      console.error("Borrow failed:", error);
      alert("Borrow failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Lending & Borrowing</h2>
          <p className="text-gray-600 mb-4">Connect your wallet to access lending features</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Lending & Borrowing</h2>

      {/* Pool Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">TokenA Pool</h3>
          <div className="space-y-1 text-sm">
            <p>Total Deposits: {poolStats.tokenA?.totalDeposits || "0"} TokenA</p>
            <p>Total Borrows: {poolStats.tokenA?.totalBorrows || "0"} TokenA</p>
            <p>Utilization: {poolStats.tokenA?.utilizationRate || 0}%</p>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">TokenB Pool</h3>
          <div className="space-y-1 text-sm">
            <p>Total Deposits: {poolStats.tokenB?.totalDeposits || "0"} TokenB</p>
            <p>Total Borrows: {poolStats.tokenB?.totalBorrows || "0"} TokenB</p>
            <p>Utilization: {poolStats.tokenB?.utilizationRate || 0}%</p>
          </div>
        </div>
      </div>

      {/* User Positions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Your TokenA Position</h3>
          <div className="space-y-1 text-sm">
            <p>Deposited: {userDeposits.tokenA?.deposit || "0"} TokenA</p>
            <p>Borrowed: {userDeposits.tokenA?.borrow || "0"} TokenA</p>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Your TokenB Position</h3>
          <div className="space-y-1 text-sm">
            <p>Deposited: {userDeposits.tokenB?.deposit || "0"} TokenB</p>
            <p>Borrowed: {userDeposits.tokenB?.borrow || "0"} TokenB</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposit */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Deposit</h3>
          <div className="space-y-4">
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="tokenA">TokenA</option>
              <option value="tokenB">TokenB</option>
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

        {/* Borrow */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Borrow</h3>
          <div className="space-y-4">
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="tokenA">TokenA</option>
              <option value="tokenB">TokenB</option>
            </select>
            <input
              type="number"
              placeholder="Amount to borrow"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleBorrow}
              disabled={isLoading || !borrowAmount}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "Borrowing..." : "Borrow"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}