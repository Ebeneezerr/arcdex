import { NextResponse } from "next/server";
import { getAbuseDetectionService } from "@/lib/abuseDetection";
import { getMetricsAggregator } from "@/lib/metricsAggregator";

export async function GET() {
  try {
    const abuseDetection = getAbuseDetectionService();
    const aggregator = getMetricsAggregator();

    const report = abuseDetection.generateAbuseReport();
    const aggregatedMetrics = aggregator.getAggregatedMetrics();

    return NextResponse.json({
      success: true,
      data: {
        report: {
          totalAlerts: report.totalAlerts,
          alertsByType: report.alertsByType,
          alertsBySeverity: report.alertsBySeverity,
          affectedUsers: report.affectedUsers,
          recentAlertsCount: report.recentAlerts.length,
          generatedAt: report.generatedAt,
        },
        aggregatedMetrics: {
          totalUsersActive: aggregatedMetrics.totalUsersActive,
          totalPointsAwarded: aggregatedMetrics.totalPointsAwarded.toString(),
          faucetClaimsToday: aggregatedMetrics.faucetClaimsToday,
          avgReputationScore: aggregatedMetrics.avgReputationScore.toString(),
        },
        healthStatus: {
          alertDensity: (report.totalAlerts / Math.max(report.affectedUsers, 1)).toFixed(2),
          systemStatus: report.recentAlerts.length > 10 ? "WARNING" : "HEALTHY",
          lastUpdate: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Error generating abuse report:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
