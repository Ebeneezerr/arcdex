import { NextResponse } from "next/server";
import { getMetricsAggregator } from "@/lib/metricsAggregator";

export async function GET() {
  try {
    const aggregator = getMetricsAggregator();
    const metrics = aggregator.getAggregatedMetrics();

    return NextResponse.json({
      success: true,
      data: {
        totalUsersActive: metrics.totalUsersActive,
        totalPointsAwarded: metrics.totalPointsAwarded.toString(),
        averagePoints: metrics.averagePoints.toString(),
        faucetClaimsToday: metrics.faucetClaimsToday,
        avgReputationScore: metrics.avgReputationScore.toString(),
        moduleBreakdown: Object.entries(metrics.moduleBreakdown).reduce(
          (acc, [moduleId, breakdown]) => {
            acc[moduleId] = {
              totalPoints: breakdown.totalPoints.toString(),
              actionCount: breakdown.actionCount,
            };
            return acc;
          },
          {} as any
        ),
        topUsers: metrics.topUsers.map((user) => ({
          userAddress: user.userAddress,
          lifetimePoints: user.lifetimePoints.toString(),
          reputationScore: user.reputationScore.toString(),
          dailyFaucetClaims: user.dailyFaucetClaims,
        })),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching aggregated metrics:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
