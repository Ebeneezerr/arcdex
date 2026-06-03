import { NextRequest, NextResponse } from "next/server";
import { getMetricsAggregator } from "@/lib/metricsAggregator";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userAddress = searchParams.get("user");
    const days = parseInt(searchParams.get("days") || "7");

    const aggregator = getMetricsAggregator();

    if (!userAddress) {
      return NextResponse.json(
        { error: "User address is required" },
        { status: 400 }
      );
    }

    const metrics = aggregator.getUserMetrics(userAddress);

    if (!metrics) {
      return NextResponse.json(
        { error: "User not found", history: [] },
        { status: 404 }
      );
    }

    // Filter faucet history by date range
    const now = Date.now();
    const daysMs = days * 24 * 60 * 60 * 1000;
    const cutoffTime = now - daysMs;

    const faucetHistory = metrics.pointsHistory
      .filter((h) => h.module === 0 && h.timestamp >= cutoffTime)
      .map((h) => ({
        timestamp: h.timestamp,
        date: new Date(h.timestamp).toISOString(),
        points: h.points.toString(),
        module: "Faucet",
      }));

    const claimStats = {
      totalClaims: faucetHistory.length,
      totalPointsFromFaucet: faucetHistory.reduce(
        (sum, h) => sum + BigInt(h.points),
        0n
      ).toString(),
      averagePointsPerClaim:
        faucetHistory.length > 0
          ? (
              faucetHistory.reduce(
                (sum, h) => sum + BigInt(h.points),
                0n
              ) / BigInt(faucetHistory.length)
            ).toString()
          : "0",
      lastClaimTime: faucetHistory.length > 0 ? faucetHistory[0].timestamp : null,
      nextAvailableClaimTime: metrics.dailyFaucetClaims >= 5
        ? new Date().setHours(24, 0, 0, 0)
        : Date.now(),
    };

    return NextResponse.json({
      success: true,
      data: {
        userAddress,
        daysRequested: days,
        claimStats,
        history: faucetHistory.sort((a, b) => b.timestamp - a.timestamp),
        dailyClaimsRemaining: Math.max(0, 5 - (metrics.dailyFaucetClaims || 0)),
      },
    });
  } catch (error) {
    console.error("Error fetching faucet history:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
