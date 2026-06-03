import { PointsEvent, FaucetEvent, ReputationUpdate } from "./eventListener";

export interface UserMetrics {
  userAddress: string;
  lifetimePoints: bigint;
  reputationScore: bigint;
  dailyFaucetClaims: number;
  moduleContributions: {
    [moduleId: number]: {
      points: bigint;
      actionCount: number;
      lastAction: number;
    };
  };
  pointsHistory: {
    timestamp: number;
    points: bigint;
    module: number;
    transactionHash: string;
  }[];
  reputationHistory: {
    timestamp: number;
    reputation: bigint;
    penalty: bigint;
  }[];
  lastUpdated: number;
}

export interface AggregatedMetrics {
  totalUsersActive: number;
  totalPointsAwarded: bigint;
  averagePoints: bigint;
  moduleBreakdown: {
    [moduleId: number]: {
      totalPoints: bigint;
      actionCount: number;
    };
  };
  faucetClaimsToday: number;
  avgReputationScore: bigint;
  topUsers: UserMetrics[];
}

export class MetricsAggregator {
  private userMetrics: Map<string, UserMetrics> = new Map();
  private updateCallbacks: Function[] = [];
  private maxHistorySize = 1000;
  private dailyResetTime = 0;

  constructor() {
    this.dailyResetTime = this.getDayStart();
  }

  private getDayStart(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  }

  onPointsAwarded(event: PointsEvent) {
    const user = event.user.toLowerCase();
    const metrics = this.getOrCreateMetrics(user);

    metrics.lifetimePoints += event.points;
    metrics.moduleContributions[event.module] = metrics.moduleContributions[
      event.module
    ] || {
      points: 0n,
      actionCount: 0,
      lastAction: 0,
    };

    metrics.moduleContributions[event.module].points += event.points;
    metrics.moduleContributions[event.module].actionCount += 1;
    metrics.moduleContributions[event.module].lastAction = event.timestamp;

    metrics.pointsHistory.push({
      timestamp: event.timestamp,
      points: event.points,
      module: event.module,
      transactionHash: event.transactionHash,
    });

    if (metrics.pointsHistory.length > this.maxHistorySize) {
      metrics.pointsHistory.shift();
    }

    metrics.lastUpdated = Date.now();
    this.userMetrics.set(user, metrics);
    this.notifyUpdate();
  }

  onFaucetClaimed(event: FaucetEvent) {
    const user = event.user.toLowerCase();
    const metrics = this.getOrCreateMetrics(user);

    if (event.timestamp > this.dailyResetTime) {
      metrics.dailyFaucetClaims += 1;
    } else {
      this.dailyResetTime = this.getDayStart();
      metrics.dailyFaucetClaims = 1;
    }

    metrics.lastUpdated = Date.now();
    this.userMetrics.set(user, metrics);
    this.notifyUpdate();
  }

  onReputationUpdated(event: ReputationUpdate) {
    const user = event.user.toLowerCase();
    const metrics = this.getOrCreateMetrics(user);

    metrics.reputationScore = event.newReputation;
    metrics.reputationHistory.push({
      timestamp: event.timestamp,
      reputation: event.newReputation,
      penalty: event.penalty,
    });

    if (metrics.reputationHistory.length > this.maxHistorySize) {
      metrics.reputationHistory.shift();
    }

    metrics.lastUpdated = Date.now();
    this.userMetrics.set(user, metrics);
    this.notifyUpdate();
  }

  private getOrCreateMetrics(userAddress: string): UserMetrics {
    const user = userAddress.toLowerCase();
    if (!this.userMetrics.has(user)) {
      this.userMetrics.set(user, {
        userAddress: user,
        lifetimePoints: 0n,
        reputationScore: 0n,
        dailyFaucetClaims: 0,
        moduleContributions: {},
        pointsHistory: [],
        reputationHistory: [],
        lastUpdated: Date.now(),
      });
    }
    return this.userMetrics.get(user)!;
  }

  getUserMetrics(userAddress: string): UserMetrics | null {
    return this.userMetrics.get(userAddress.toLowerCase()) || null;
  }

  getAllUserMetrics(): UserMetrics[] {
    return Array.from(this.userMetrics.values());
  }

  getAggregatedMetrics(): AggregatedMetrics {
    const allMetrics = Array.from(this.userMetrics.values());
    const moduleBreakdown: {
      [moduleId: number]: {
        totalPoints: bigint;
        actionCount: number;
      };
    } = {};

    let totalPoints = 0n;
    let totalActions = 0;
    let totalFaucetClaims = 0;
    let totalReputation = 0n;

    allMetrics.forEach((metrics) => {
      totalPoints += metrics.lifetimePoints;
      totalReputation += metrics.reputationScore;
      totalFaucetClaims += metrics.dailyFaucetClaims;

      Object.entries(metrics.moduleContributions).forEach(
        ([moduleId, contribution]) => {
          const modId = Number(moduleId);
          if (!moduleBreakdown[modId]) {
            moduleBreakdown[modId] = { totalPoints: 0n, actionCount: 0 };
          }
          moduleBreakdown[modId].totalPoints += contribution.points;
          moduleBreakdown[modId].actionCount += contribution.actionCount;
          totalActions += contribution.actionCount;
        }
      );
    });

    const avgPoints =
      allMetrics.length > 0
        ? totalPoints / BigInt(allMetrics.length)
        : 0n;
    const avgReputation =
      allMetrics.length > 0
        ? totalReputation / BigInt(allMetrics.length)
        : 0n;

    const topUsers = allMetrics
      .sort((a, b) => {
        if (a.lifetimePoints > b.lifetimePoints) return -1;
        if (a.lifetimePoints < b.lifetimePoints) return 1;
        return 0;
      })
      .slice(0, 10);

    return {
      totalUsersActive: allMetrics.length,
      totalPointsAwarded: totalPoints,
      averagePoints: avgPoints,
      moduleBreakdown,
      faucetClaimsToday: totalFaucetClaims,
      avgReputationScore: avgReputation,
      topUsers,
    };
  }

  registerUpdateCallback(callback: Function) {
    this.updateCallbacks.push(callback);
  }

  private notifyUpdate() {
    this.updateCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Error in update callback:", error);
      }
    });
  }

  reset() {
    this.userMetrics.clear();
    this.notifyUpdate();
  }
}

// Global aggregator instance
let globalAggregator: MetricsAggregator | null = null;

export function getMetricsAggregator(): MetricsAggregator {
  if (!globalAggregator) {
    globalAggregator = new MetricsAggregator();
  }
  return globalAggregator;
}
