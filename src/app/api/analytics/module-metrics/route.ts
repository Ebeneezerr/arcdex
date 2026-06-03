import { NextRequest, NextResponse } from "next/server";
import { getMetricsAggregator } from "@/lib/metricsAggregator";
import { getAstroDEXModuleMetadataById } from "@/lib/dexConfig";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userAddress = searchParams.get("user");
    const moduleId = searchParams.get("module");

    const aggregator = getMetricsAggregator();

    if (userAddress) {
      const metrics = aggregator.getUserMetrics(userAddress);

      if (!metrics) {
        return NextResponse.json(
          { error: "User not found", modules: [] },
          { status: 404 }
        );
      }

      const moduleMetrics = Object.entries(metrics.moduleContributions).map(
        ([modId, contribution]) => {
          const mid = parseInt(modId);
          const moduleMetadata = getAstroDEXModuleMetadataById(mid);
          const weight = moduleMetadata?.weight || 1.0;
          const adjustedPoints = contribution.points * BigInt(Math.floor(weight * 100)) / 100n;

          return {
            moduleId: mid,
            moduleName: moduleMetadata?.label || `Module ${mid}`,
            points: contribution.points.toString(),
            adjustedPoints: adjustedPoints.toString(),
            actionCount: contribution.actionCount,
            lastAction: contribution.lastAction ? new Date(contribution.lastAction).toISOString() : null,
            qualityFactor: weight,
            averagePointsPerAction:
              contribution.actionCount > 0
                ? (contribution.points / BigInt(contribution.actionCount)).toString()
                : "0",
          };
        }
      );

      // Sort by total points descending
      moduleMetrics.sort((a, b) => {
        const aPoints = BigInt(a.points);
        const bPoints = BigInt(b.points);
        if (bPoints > aPoints) return 1;
        if (bPoints < aPoints) return -1;
        return 0;
      });

      // Calculate diversity bonus
      const activeModules = moduleMetrics.filter((m) => m.actionCount > 0).length;
      const diversityBonus =
        activeModules >= 3
          ? 1.0 + (activeModules - 3) * 0.05 // 5% bonus per additional module beyond 3
          : 1.0;

      return NextResponse.json({
        success: true,
        data: {
          userAddress,
          totalModules: moduleMetrics.length,
          activeModules,
          diversityBonus: diversityBonus.toFixed(2),
          modules: moduleMetrics,
          totalPoints: metrics.lifetimePoints.toString(),
          qualityFactorOverview: {
            highest: moduleMetrics[0],
            average:
              moduleMetrics.length > 0
                ? (
                    moduleMetrics.reduce((sum, m) => sum + m.qualityFactor, 0) /
                    moduleMetrics.length
                  ).toFixed(2)
                : "0",
          },
        },
      });
    } else {
      // Get global module metrics (aggregated across all users)
      const allMetrics = aggregator.getAllUserMetrics();
      const globalModuleStats: Record<
        number,
        {
          moduleName: string;
          totalPoints: bigint;
          totalActions: number;
          userCount: number;
          qualityFactor: number;
        }
      > = {};

      allMetrics.forEach((metrics) => {
        Object.entries(metrics.moduleContributions).forEach(([modId, contribution]) => {
          const mid = parseInt(modId);
          const moduleMetadata = getAstroDEXModuleMetadataById(mid);
          if (!globalModuleStats[mid]) {
            globalModuleStats[mid] = {
              moduleName: moduleMetadata?.label || `Module ${mid}`,
              totalPoints: 0n,
              totalActions: 0,
              userCount: 0,
              qualityFactor: moduleMetadata?.weight || 1.0,
            };
          }
          globalModuleStats[mid].totalPoints += contribution.points;
          globalModuleStats[mid].totalActions += contribution.actionCount;
          globalModuleStats[mid].userCount += 1;
        });
      });

      const moduleStats = Object.entries(globalModuleStats)
        .map(([mid, stats]) => ({
          moduleId: parseInt(mid),
          moduleName: stats.moduleName,
          totalPoints: stats.totalPoints.toString(),
          totalActions: stats.totalActions,
          userCount: stats.userCount,
          averagePointsPerUser:
            stats.userCount > 0
              ? (stats.totalPoints / BigInt(stats.userCount)).toString()
              : "0",
          qualityFactor: stats.qualityFactor,
        }))
        .sort((a, b) => parseInt(b.totalPoints) - parseInt(a.totalPoints));

      return NextResponse.json({
        success: true,
        data: {
          totalUsers: allMetrics.length,
          modules: moduleStats,
          topModule:
            moduleStats.length > 0
              ? { name: moduleStats[0].moduleName, points: moduleStats[0].totalPoints }
              : null,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching module metrics:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
