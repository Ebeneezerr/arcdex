import { UserMetrics } from "./metricsAggregator";

export interface AbuseAlert {
  userId: string;
  alertType:
    | "multi_wallet_faucet"
    | "rapid_actions"
    | "suspicious_transfer"
    | "low_reputation"
    | "point_anomaly";
  severity: "low" | "medium" | "high";
  description: string;
  timestamp: number;
  evidence: string[];
}

export class AbuseDetectionService {
  private walletMappings: Map<string, Set<string>> = new Map(); // tokenTransfer -> [wallets]
  private alerts: AbuseAlert[] = [];
  private maxAlertsStored = 500;

  // Configuration thresholds
  private readonly MAX_DAILY_FAUCET_CLAIMS = 5;
  private readonly MAX_ACTIONS_PER_HOUR = 20;
  private readonly MIN_REPUTATION_THRESHOLD = BigInt(100);
  private readonly POINT_ANOMALY_THRESHOLD = 1.5; // 150% of expected
  private readonly RAPID_ACTION_WINDOW = 60 * 1000; // 1 minute

  detectMultiWalletAbuse(
    userAddress: string,
    relatedWallets: string[]
  ): AbuseAlert | null {
    if (relatedWallets.length < 2) return null;

    const alert: AbuseAlert = {
      userId: userAddress,
      alertType: "multi_wallet_faucet",
      severity: "high",
      description: `User ${userAddress} associated with ${relatedWallets.length} wallets attempting to aggregate faucet rewards`,
      timestamp: Date.now(),
      evidence: relatedWallets,
    };

    this.registerAlert(alert);
    return alert;
  }

  detectRapidActions(
    userMetrics: UserMetrics,
    window: number = this.RAPID_ACTION_WINDOW
  ): AbuseAlert | null {
    const now = Date.now();
    const recentActions = userMetrics.pointsHistory.filter(
      (h) => now - h.timestamp < window
    );

    if (recentActions.length > this.MAX_ACTIONS_PER_HOUR) {
      const alert: AbuseAlert = {
        userId: userMetrics.userAddress,
        alertType: "rapid_actions",
        severity: "medium",
        description: `${recentActions.length} actions detected in ${window / 1000} seconds (threshold: ${this.MAX_ACTIONS_PER_HOUR})`,
        timestamp: now,
        evidence: recentActions.map((a) => `${a.module}:${a.points}`),
      };

      this.registerAlert(alert);
      return alert;
    }

    return null;
  }

  detectExcessiveFaucetClaims(userMetrics: UserMetrics): AbuseAlert | null {
    if (userMetrics.dailyFaucetClaims > this.MAX_DAILY_FAUCET_CLAIMS) {
      const alert: AbuseAlert = {
        userId: userMetrics.userAddress,
        alertType: "multi_wallet_faucet",
        severity: "high",
        description: `${userMetrics.dailyFaucetClaims} faucet claims today (max allowed: ${this.MAX_DAILY_FAUCET_CLAIMS})`,
        timestamp: Date.now(),
        evidence: [`claims: ${userMetrics.dailyFaucetClaims}`],
      };

      this.registerAlert(alert);
      return alert;
    }

    return null;
  }

  detectLowReputation(userMetrics: UserMetrics): AbuseAlert | null {
    if (
      userMetrics.lifetimePoints > BigInt(1000) &&
      userMetrics.reputationScore < this.MIN_REPUTATION_THRESHOLD
    ) {
      const alert: AbuseAlert = {
        userId: userMetrics.userAddress,
        alertType: "low_reputation",
        severity: "medium",
        description: `Low reputation score (${userMetrics.reputationScore}) despite ${userMetrics.lifetimePoints} lifetime points`,
        timestamp: Date.now(),
        evidence: [
          `reputation: ${userMetrics.reputationScore}`,
          `lifetime_points: ${userMetrics.lifetimePoints}`,
        ],
      };

      this.registerAlert(alert);
      return alert;
    }

    return null;
  }

  detectPointAnomaly(
    userMetrics: UserMetrics,
    expectedPointsRange: {
      min: bigint;
      max: bigint;
    }
  ): AbuseAlert | null {
    const { min, max } = expectedPointsRange;

    if (
      userMetrics.lifetimePoints < min ||
      userMetrics.lifetimePoints > max * BigInt(Math.floor(this.POINT_ANOMALY_THRESHOLD))
    ) {
      const alert: AbuseAlert = {
        userId: userMetrics.userAddress,
        alertType: "point_anomaly",
        severity: "high",
        description: `Points (${userMetrics.lifetimePoints}) outside expected range [${min}, ${max}]`,
        timestamp: Date.now(),
        evidence: [
          `points: ${userMetrics.lifetimePoints}`,
          `expected: ${min}-${max}`,
        ],
      };

      this.registerAlert(alert);
      return alert;
    }

    return null;
  }

  flagSuspiciousTransfer(
    from: string,
    to: string,
    amount: bigint
  ): AbuseAlert | null {
    // Track token transfer relationships
    const key = `${from}->${to}`;
    if (!this.walletMappings.has(key)) {
      this.walletMappings.set(key, new Set());
    }
    this.walletMappings.get(key)!.add(from);

    // If high-value transfer detected after faucet claim
    if (amount > BigInt(1000)) {
      const alert: AbuseAlert = {
        userId: from,
        alertType: "suspicious_transfer",
        severity: "medium",
        description: `High-value transfer (${amount}) detected from ${from} to ${to}`,
        timestamp: Date.now(),
        evidence: [`amount: ${amount}`, `recipient: ${to}`],
      };

      this.registerAlert(alert);
      return alert;
    }

    return null;
  }

  private registerAlert(alert: AbuseAlert) {
    this.alerts.push(alert);
    if (this.alerts.length > this.maxAlertsStored) {
      this.alerts.shift();
    }

    // Log for monitoring
    console.warn(`[ABUSE ALERT] ${alert.severity.toUpperCase()}: ${alert.description}`);
  }

  getAllAlerts(): AbuseAlert[] {
    return [...this.alerts];
  }

  getAlertsByUser(userAddress: string): AbuseAlert[] {
    return this.alerts.filter((a) => a.userId.toLowerCase() === userAddress.toLowerCase());
  }

  getAlertsBySeverity(severity: "low" | "medium" | "high"): AbuseAlert[] {
    return this.alerts.filter((a) => a.severity === severity);
  }

  getRecentAlerts(minutes: number = 60): AbuseAlert[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.alerts.filter((a) => a.timestamp > cutoff);
  }

  clearAlerts() {
    this.alerts = [];
  }

  generateAbuseReport() {
    const report = {
      totalAlerts: this.alerts.length,
      alertsByType: this.groupBy(this.alerts, (a) => a.alertType),
      alertsBySeverity: this.groupBy(this.alerts, (a) => a.severity),
      affectedUsers: new Set(this.alerts.map((a) => a.userId)).size,
      recentAlerts: this.getRecentAlerts(24 * 60), // Last 24 hours
      generatedAt: new Date().toISOString(),
    };

    return report;
  }

  private groupBy<T>(items: T[], getKey: (item: T) => string): Record<string, number> {
    return items.reduce(
      (acc, item) => {
        const key = getKey(item);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }
}

// Global abuse detection instance
let globalAbuseDetection: AbuseDetectionService | null = null;

export function getAbuseDetectionService(): AbuseDetectionService {
  if (!globalAbuseDetection) {
    globalAbuseDetection = new AbuseDetectionService();
  }
  return globalAbuseDetection;
}
