import { NextRequest, NextResponse } from "next/server";
import { getMetricsAggregator } from "@/lib/metricsAggregator";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userAddress = searchParams.get("user");

    const aggregator = getMetricsAggregator();

    if (userAddress) {
      // Get metrics for a specific user
      const metrics = aggregator.getUserMetrics(userAddress);

      if (!metrics) {
        return NextResponse.json(
          {
            error: "User not found",
            metrics: null,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          userAddress: metrics.userAddress,
          lifetimePoints: metrics.lifetimePoints.toString(),
          reputationScore: metrics.reputationScore.toString(),
          dailyFaucetClaims: metrics.dailyFaucetClaims,
          moduleContributions: Object.entries(metrics.moduleContributions).reduce(
            (acc, [moduleId, contribution]) => {
              acc[moduleId] = {
                points: contribution.points.toString(),
                actionCount: contribution.actionCount,
                lastAction: contribution.lastAction,
              };
              return acc;
            },
            {} as any
          ),
          pointsHistory: metrics.pointsHistory.map((h) => ({
            ...h,
            points: h.points.toString(),
          })),
          reputationHistory: metrics.reputationHistory.map((h) => ({
            ...h,
            reputation: h.reputation.toString(),
            penalty: h.penalty.toString(),
          })),
          lastUpdated: metrics.lastUpdated,
        },
      });
    } else {
      // Get all users' metrics
      const allMetrics = aggregator.getAllUserMetrics();

      return NextResponse.json({
        success: true,
        count: allMetrics.length,
        data: allMetrics.map((metrics) => ({
          userAddress: metrics.userAddress,
          lifetimePoints: metrics.lifetimePoints.toString(),
          reputationScore: metrics.reputationScore.toString(),
          dailyFaucetClaims: metrics.dailyFaucetClaims,
          moduleCount: Object.keys(metrics.moduleContributions).length,
          lastUpdated: metrics.lastUpdated,
        })),
      });
    }
  } catch (error) {
    console.error("Error fetching user metrics:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
