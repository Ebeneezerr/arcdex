import { NextRequest, NextResponse } from "next/server";
import { getAbuseDetectionService } from "@/lib/abuseDetection";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userAddress = searchParams.get("user");
    const severity = searchParams.get("severity");
    const minutesParam = searchParams.get("minutes");

    const abuseDetection = getAbuseDetectionService();
    let alerts;

    if (userAddress) {
      alerts = abuseDetection.getAlertsByUser(userAddress);
    } else if (severity) {
      alerts = abuseDetection.getAlertsBySeverity(severity as any);
    } else if (minutesParam) {
      alerts = abuseDetection.getRecentAlerts(Number(minutesParam));
    } else {
      alerts = abuseDetection.getAllAlerts();
    }

    return NextResponse.json({
      success: true,
      count: alerts.length,
      data: alerts.map((alert) => ({
        userId: alert.userId,
        alertType: alert.alertType,
        severity: alert.severity,
        description: alert.description,
        timestamp: alert.timestamp,
        evidence: alert.evidence,
        age: Date.now() - alert.timestamp,
      })),
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
