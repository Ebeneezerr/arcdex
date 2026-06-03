import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

export interface DemoAssetPrice {
  symbol: string;
  address: string;
  priceUsd: number;
  priceUsd8: bigint;
  lastUpdate: number;
}

export interface Position {
  id: number;
  trader: string;
  dAsset: string;
  margin: string;
  entryPrice: number;
  openTime: number;
  isLong: boolean;
  isOpen: boolean;
  pnl?: number;
  currentPnL?: number;
  profitBps?: number;
}

export interface TradingStats {
  totalTrades: number;
  winningTrades: number;
  totalPnL: number;
  averageProfit: number;
}

const DEMO_ASSETS = [
  { symbol: 'dBTC', name: 'Bitcoin' },
  { symbol: 'dETH', name: 'Ethereum' },
  { symbol: 'dBNB', name: 'Binance Coin' },
  { symbol: 'dSOL', name: 'Solana' },
  { symbol: 'dUSDC', name: 'USDC' },
];

export function useDemoTrading(
  demoTradingAddress: string | undefined,
  tokenAAddress: string | undefined,
  tokenBAddress: string | undefined,
  oracleAddress: string | undefined,
  userAddress: string | undefined
) {
  const [prices, setPrices] = useState<DemoAssetPrice[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [tradingStats, setTradingStats] = useState<TradingStats>({
    totalTrades: 0,
    winningTrades: 0,
    totalPnL: 0,
    averageProfit: 0,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch prices from mock oracle
  const fetchPrices = useCallback(async () => {
    if (!oracleAddress) return;

    try {
      setIsLoading(true);
      // This would fetch real prices from oracle in production
      // For now, use mock prices
      const mockPrices: DemoAssetPrice[] = [
        {
          symbol: 'dBTC',
          address: 'dBTC',
          priceUsd: 65000,
          priceUsd8: BigInt(65000 * 1e8),
          lastUpdate: Date.now(),
        },
        {
          symbol: 'dETH',
          address: 'dETH',
          priceUsd: 3500,
          priceUsd8: BigInt(3500 * 1e8),
          lastUpdate: Date.now(),
        },
        {
          symbol: 'dBNB',
          address: 'dBNB',
          priceUsd: 600,
          priceUsd8: BigInt(600 * 1e8),
          lastUpdate: Date.now(),
        },
        {
          symbol: 'dSOL',
          address: 'dSOL',
          priceUsd: 150,
          priceUsd8: BigInt(150 * 1e8),
          lastUpdate: Date.now(),
        },
        {
          symbol: 'dUSDC',
          address: 'dUSDC',
          priceUsd: 1,
          priceUsd8: BigInt(1 * 1e8),
          lastUpdate: Date.now(),
        },
      ];
      setPrices(mockPrices);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch prices';
      setErrors((prev) => [...prev, errorMsg]);
      console.error('Error fetching prices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [oracleAddress]);

  // Fetch user positions
  const fetchPositions = useCallback(async () => {
    if (!demoTradingAddress || !userAddress) return;

    try {
      setIsLoading(true);
      // This would fetch real positions from contract in production
      // For now, use mock data for demonstration
      setPositions([]);
      setOpenPositions([]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch positions';
      setErrors((prev) => [...prev, errorMsg]);
      console.error('Error fetching positions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [demoTradingAddress, userAddress]);

  // Initial data load
  useEffect(() => {
    fetchPrices();
    fetchPositions();
  }, [fetchPrices, fetchPositions]);

  // Open position
  const openPosition = useCallback(
    async (assetSymbol: string, margin: string, isLong: boolean) => {
      if (!demoTradingAddress || !userAddress) {
        setErrors((prev) => [...prev, 'Wallet not connected']);
        return;
      }

      try {
        setIsLoading(true);

        // Get asset address from symbol
        const assetMap: Record<string, string> = {
          dBTC: 'dBTC',
          dETH: 'dETH',
          dBNB: 'dBNB',
          dSOL: 'dSOL',
          dUSDC: 'dUSDC',
        };

        const assetAddr = assetMap[assetSymbol];
        if (!assetAddr) {
          throw new Error('Invalid asset selected');
        }

        const marginAmount = ethers.parseEther(margin);

        // This would normally call the contract
        // In production: await demoTradingContract.openPosition(assetAddr, marginAmount, isLong)
        console.log('[Demo] Opening position:', {
          asset: assetSymbol,
          margin: margin,
          isLong,
        });

        // Update local state for demo
        const newPosition: Position = {
          id: positions.length + 1,
          trader: userAddress,
          dAsset: assetAddr,
          margin: margin,
          entryPrice: prices.find((p) => p.symbol === assetSymbol)?.priceUsd || 0,
          openTime: Math.floor(Date.now() / 1000),
          isLong,
          isOpen: true,
          pnl: 0,
        };

        setOpenPositions((prev) => [...prev, newPosition]);
        setErrors([]);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to open position';
        setErrors((prev) => [...prev, errorMsg]);
        console.error('Error opening position:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [demoTradingAddress, userAddress, positions, prices]
  );

  // Close position
  const closePosition = useCallback(
    async (positionId: number) => {
      if (!demoTradingAddress) {
        setErrors((prev) => [...prev, 'Contract not available']);
        return;
      }

      try {
        setIsLoading(true);

        // This would normally call the contract
        // In production: await demoTradingContract.closePosition(positionId)
        console.log('[Demo] Closing position:', positionId);

        // Update local state for demo
        setOpenPositions((prev) => prev.filter((p) => p.id !== positionId));
        setErrors([]);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to close position';
        setErrors((prev) => [...prev, errorMsg]);
        console.error('Error closing position:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [demoTradingAddress]
  );

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchPrices(), fetchPositions()]);
  }, [fetchPrices, fetchPositions]);

  // Clear errors
  const clearError = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    prices,
    positions,
    openPositions,
    tradingStats,
    errors,
    openPosition,
    closePosition,
    refreshData,
    clearError,
  };
}
