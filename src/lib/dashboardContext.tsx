"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  AstroDEXAnalyticsListener,
  getAnalyticsListener,
  PointsEvent,
  FaucetEvent,
  ReputationUpdate,
} from "@/lib/eventListener";
import type { ModuleMetadata } from "@/lib/dexConfig";
import {
  MetricsAggregator,
  getMetricsAggregator,
  UserMetrics,
  AggregatedMetrics,
} from "@/lib/metricsAggregator";
import {
  AbuseDetectionService,
  getAbuseDetectionService,
  AbuseAlert,
} from "@/lib/abuseDetection";

interface DashboardContextType {
  // User metrics
  userMetrics: UserMetrics | null;
  userAddress: string | null;

  // Aggregated data
  aggregatedMetrics: AggregatedMetrics | null;

  // Abuse alerts
  recentAlerts: AbuseAlert[];

  // Status
  isConnected: boolean;
  isListening: boolean;
  error: string | null;

  // Actions
  claimFaucet: (tokenAddress: string) => Promise<void>;
  refreshMetrics: () => Promise<void>;
  initializeDashboard: (userAddress: string, contracts: any, moduleMetadata?: ModuleMetadata[]) => Promise<void>;
  setUserAddress: (address: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [userAddress, setUserAddressState] = useState<string | null>(null);
  const [aggregatedMetrics, setAggregatedMetrics] = useState<AggregatedMetrics | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<AbuseAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listener = getAnalyticsListener();
  const aggregator = getMetricsAggregator();
  const abuseDetection = getAbuseDetectionService();

  // Register event handlers
  useEffect(() => {
    const handlePointsAwarded = (event: PointsEvent) => {
      aggregator.onPointsAwarded(event);
      if (userAddress && event.user.toLowerCase() === userAddress.toLowerCase()) {
        setUserMetrics(aggregator.getUserMetrics(userAddress));
      }
      setAggregatedMetrics(aggregator.getAggregatedMetrics());
    };

    const handleFaucetClaimed = (event: FaucetEvent) => {
      aggregator.onFaucetClaimed(event);
      if (userAddress && event.user.toLowerCase() === userAddress.toLowerCase()) {
        const metrics = aggregator.getUserMetrics(userAddress);
        setUserMetrics(metrics);

        // Check for abuse
        const claimAlert = abuseDetection.detectExcessiveFaucetClaims(metrics!);
        if (claimAlert) {
          setRecentAlerts((prev) => [claimAlert!, ...prev.slice(0, 9)]);
        }
      }
      setAggregatedMetrics(aggregator.getAggregatedMetrics());
    };

    const handleReputationUpdated = (event: ReputationUpdate) => {
      aggregator.onReputationUpdated(event);
      if (userAddress && event.user.toLowerCase() === userAddress.toLowerCase()) {
        const metrics = aggregator.getUserMetrics(userAddress);
        setUserMetrics(metrics);

        // Check for low reputation
        if (metrics) {
          const repAlert = abuseDetection.detectLowReputation(metrics);
          if (repAlert) {
            setRecentAlerts((prev) => [repAlert!, ...prev.slice(0, 9)]);
          }
        }
      }
      setAggregatedMetrics(aggregator.getAggregatedMetrics());
    };

    listener.on("pointsAwarded", handlePointsAwarded);
    listener.on("faucetClaimed", handleFaucetClaimed);
    listener.on("reputationUpdated", handleReputationUpdated);

    return () => {
      listener.off("pointsAwarded", handlePointsAwarded);
      listener.off("faucetClaimed", handleFaucetClaimed);
      listener.off("reputationUpdated", handleReputationUpdated);
    };
  }, [userAddress, aggregator, listener, abuseDetection]);

  const initializeDashboard = useCallback(
    async (userAddr: string, contracts: any, moduleMetadata: ModuleMetadata[] = []) => {
      try {
        setError(null);
        setUserAddressState(userAddr);

        // Initialize listener if not already done
        if (!isListening) {
          const provider = contracts.provider?.connection?.url || "http://localhost:8545";
          const eventSources = Array.from(
            new Set(moduleMetadata.flatMap((module) => module.eventSources || []))
          );

          await listener.initialize(
            provider,
            contracts.pointsTracker?.address,
            contracts.faucet?.address,
            contracts.demoTrading?.address,
            eventSources
          );

          await listener.startListening();
          setIsListening(true);
        }

        setIsConnected(true);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        console.error("Failed to initialize dashboard:", err);
      }
    },
    [listener, isListening]
  );

  const claimFaucet = useCallback(
    async (tokenAddress: string) => {
      try {
        if (!userAddress) {
          setError("User not connected");
          return;
        }

        // This would normally interact with the actual faucet contract
        // For now, we're just tracking via event listening
        console.log(`Claiming from faucet token: ${tokenAddress}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to claim faucet";
        setError(errorMsg);
      }
    },
    [userAddress]
  );

  const refreshMetrics = useCallback(async () => {
    if (!userAddress) return;

    const metrics = aggregator.getUserMetrics(userAddress);
    setUserMetrics(metrics);
    setAggregatedMetrics(aggregator.getAggregatedMetrics());

    // Check for abuse
    if (metrics) {
      const alerts: AbuseAlert[] = [];

      const rapidAlert = abuseDetection.detectRapidActions(metrics);
      if (rapidAlert) alerts.push(rapidAlert);

      const claimAlert = abuseDetection.detectExcessiveFaucetClaims(metrics);
      if (claimAlert) alerts.push(claimAlert);

      const repAlert = abuseDetection.detectLowReputation(metrics);
      if (repAlert) alerts.push(repAlert);

      if (alerts.length > 0) {
        setRecentAlerts((prev) => [...alerts, ...prev].slice(0, 10));
      }
    }
  }, [userAddress, aggregator, abuseDetection]);

  const setUserAddress = useCallback((address: string) => {
    setUserAddressState(address);
    const metrics = aggregator.getUserMetrics(address);
    setUserMetrics(metrics);
  }, [aggregator]);

  const value: DashboardContextType = {
    userMetrics,
    userAddress,
    aggregatedMetrics,
    recentAlerts,
    isConnected,
    isListening,
    error,
    claimFaucet,
    refreshMetrics,
    initializeDashboard,
    setUserAddress,
  };

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
