import { NextRequest, NextResponse } from "next/server";
import { getMetricsAggregator } from "@/lib/metricsAggregator";

interface StressTestMetrics {
  timestamp: number;
  activeUsers: number;
  transactionsPerSecond: number;
  averageResponseTime: number;
  peakMemory: number;
  errorRate: number;
  pointsAwarded: string;
  faucetClaimsProcessed: number;
  moduleActionsProcessed: number;
}

// In-memory store for stress test metrics (in production, use a database)
const stressMetricsStore: StressTestMetrics[] = [];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const duration = parseInt(searchParams.get("duration") || "60"); // Last N minutes
    const limit = parseInt(searchParams.get("limit") || "100");

    const aggregator = getMetricsAggregator();
    const allMetrics = aggregator.getAllUserMetrics();

    // Calculate current metrics
    const now = Date.now();
    const durationMs = duration * 60 * 1000;
    const cutoffTime = now - durationMs;

    // Count recent actions
    let recentActions = 0;
    let recentFaucetClaims = 0;
    let recentPoints = 0n;

    allMetrics.forEach((metric) => {
      metric.pointsHistory.forEach((h) => {
        if (h.timestamp >= cutoffTime) {
          recentActions++;
          recentPoints += h.points;
          if (h.module === 0) recentFaucetClaims++;
        }
      });
    });

    // Calculate metrics
    const activeUsers = allMetrics.length;
    const transactionsPerSecond =
      duration > 0 ? recentActions / (duration * 60) : 0;
    const averageResponseTime = Math.random() * 500 + 50; // Mock: 50-550ms
    const peakMemory = Math.random() * 512 + 256; // Mock: 256-768MB
    const errorRate = Math.random() * 0.05; // Mock: 0-5%

    // Store current metrics
    const currentMetrics: StressTestMetrics = {
      timestamp: now,
      activeUsers,
      transactionsPerSecond,
      averageResponseTime,
      peakMemory,
      errorRate,
      pointsAwarded: recentPoints.toString(),
      faucetClaimsProcessed: recentFaucetClaims,
      moduleActionsProcessed: recentActions,
    };

    stressMetricsStore.push(currentMetrics);
    if (stressMetricsStore.length > 1000) {
      stressMetricsStore.shift();
    }

    // Get historical data
    const historicalMetrics = stressMetricsStore
      .filter((m) => m.timestamp >= cutoffTime)
      .slice(-limit);

    // Calculate averages
    const avgResponseTime =
      historicalMetrics.length > 0
        ? historicalMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) /
          historicalMetrics.length
        : 0;

    const avgTps =
      historicalMetrics.length > 0
        ? historicalMetrics.reduce((sum, m) => sum + m.transactionsPerSecond, 0) /
          historicalMetrics.length
        : 0;

    const peakTps = Math.max(...(historicalMetrics.map((m) => m.transactionsPerSecond) || [0]));
    const peakUsers = Math.max(...(historicalMetrics.map((m) => m.activeUsers) || [0]));

    // Health status
    const isHealthy = averageResponseTime < 1000 && errorRate < 0.1;
    const status = isHealthy ? "healthy" : errorRate > 0.2 ? "critical" : "warning";

    return NextResponse.json({
      success: true,
      data: {
        current: currentMetrics,
        historical: historicalMetrics,
        summary: {
          timeframe: `Last ${duration} minutes`,
          totalDataPoints: historicalMetrics.length,
          avgResponseTime: avgResponseTime.toFixed(2),
          avgTps: avgTps.toFixed(2),
          peakTps: peakTps.toFixed(2),
          peakUsers,
          dashboardHealth: {
            status,
            responseTimeOk: averageResponseTime < 1000,
            errorRateOk: errorRate < 0.1,
            memoryOk: peakMemory < 1024,
          },
          throughput: {
            totalActionsProcessed: recentActions,
            actionsPerSecond: (recentActions / (duration * 60)).toFixed(2),
            totalPointsAwarded: recentPoints.toString(),
            averagePointsPerAction:
              recentActions > 0
                ? (recentPoints / BigInt(recentActions)).toString()
                : "0",
            faucetInteractionRate: (recentFaucetClaims / recentActions).toFixed(2),
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching stress metrics:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "reset") {
      stressMetricsStore.length = 0;
      return NextResponse.json({
        success: true,
        message: "Stress test metrics cleared",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing stress test action:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
