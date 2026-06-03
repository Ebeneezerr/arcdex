import { NextRequest, NextResponse } from "next/server";
import { getMetricsAggregator } from "@/lib/metricsAggregator";

interface RegressionTest {
  id: string;
  name: string;
  timestamp: number;
  testType:
    | "faucet_claim"
    | "module_interaction"
    | "multi_wallet"
    | "reputation_decay"
    | "quality_factor"
    | "diversity_bonus";
  status: "passed" | "failed" | "warning";
  details: string;
  assertionCount: number;
  assertionsPassed: number;
  errorMessage?: string;
}

// In-memory test result store (in production, use a database)
const testResults: RegressionTest[] = [];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testType = searchParams.get("type");
    const days = parseInt(searchParams.get("days") || "7");
    const limit = parseInt(searchParams.get("limit") || "50");

    const now = Date.now();
    const daysMs = days * 24 * 60 * 60 * 1000;
    const cutoffTime = now - daysMs;

    let filtered = testResults.filter((t) => t.timestamp >= cutoffTime);

    if (testType) {
      filtered = filtered.filter((t) => t.testType === testType);
    }

    // Sort by timestamp descending and limit
    const results = filtered.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

    // Calculate statistics
    const stats = {
      totalTests: filtered.length,
      passed: filtered.filter((t) => t.status === "passed").length,
      failed: filtered.filter((t) => t.status === "failed").length,
      warnings: filtered.filter((t) => t.status === "warning").length,
      successRate:
        filtered.length > 0
          ? (
              (filtered.filter((t) => t.status === "passed").length / filtered.length) *
              100
            ).toFixed(2)
          : "0",
      avgAssertionPassRate:
        filtered.length > 0
          ? (
              filtered.reduce((sum, t) => sum + (t.assertionsPassed / t.assertionCount), 0) /
              filtered.length * 100
            ).toFixed(2)
          : "0",
      testTypeBreakdown: {} as Record<string, number>,
    };

    // Count by test type
    filtered.forEach((t) => {
      stats.testTypeBreakdown[t.testType] =
        (stats.testTypeBreakdown[t.testType] || 0) + 1;
    });

    // Get aggregator data for real-time validation
    const aggregator = getMetricsAggregator();
    const allMetrics = aggregator.getAllUserMetrics();

    // Run live validation checks
    const liveChecks = {
      usersWithPoints: allMetrics.filter((m) => m.lifetimePoints > 0n).length,
      usersWithReputation: allMetrics.filter((m) => m.reputationScore > 0n).length,
      averagePointsPerUser:
        allMetrics.length > 0
          ? (
              allMetrics.reduce((sum, m) => sum + m.lifetimePoints, 0n) /
              BigInt(allMetrics.length)
            ).toString()
          : "0",
      usersWithModuleParticipation: allMetrics.filter(
        (m) => Object.keys(m.moduleContributions).length > 0
      ).length,
      faucetUsageRate:
        allMetrics.length > 0
          ? (
              (allMetrics.filter((m) => m.dailyFaucetClaims > 0).length / allMetrics.length) * 100
            ).toFixed(2)
          : "0",
    };

    return NextResponse.json({
      success: true,
      data: {
        timeframe: `Last ${days} days`,
        statistics: stats,
        liveValidationChecks: liveChecks,
        recentResults: results.map((t) => ({
          id: t.id,
          name: t.name,
          testType: t.testType,
          status: t.status,
          timestamp: new Date(t.timestamp).toISOString(),
          assertionPassRate: (
            (t.assertionsPassed / t.assertionCount) * 100
          ).toFixed(2),
          details: t.details,
          errorMessage: t.errorMessage,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching regression test results:", error);
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
    const {
      name,
      testType,
      status,
      details,
      assertionCount,
      assertionsPassed,
      errorMessage,
    } = body;

    if (
      !name ||
      !testType ||
      !status ||
      assertionCount === undefined ||
      assertionsPassed === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const testResult: RegressionTest = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      testType,
      timestamp: Date.now(),
      status,
      details: details || "",
      assertionCount,
      assertionsPassed,
      errorMessage,
    };

    testResults.push(testResult);

    // Keep only last 1000 results
    if (testResults.length > 1000) {
      testResults.shift();
    }

    return NextResponse.json({
      success: true,
      data: testResult,
    });
  } catch (error) {
    console.error("Error recording regression test:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
