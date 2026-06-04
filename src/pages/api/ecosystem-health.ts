import fs from 'fs';
import path from 'path';
import os from 'os';
import type { NextApiRequest, NextApiResponse } from 'next';

function deriveHealthSignal(
  alerts?: { severity?: string; alerts?: { field?: string }[]; scoreDelta?: number }[] | null,
  interactReport?: { sustainabilityScore: number; rewardRunwayDays: number }
) {
  try {
    if (!alerts || !Array.isArray(alerts) || alerts.length === 0) {
      return 'STABLE' as const;
    }

    const latest = alerts[alerts.length - 1];
    const severity = String(latest?.severity ?? '').toUpperCase();
    if (severity === 'CRITICAL') return 'CRITICAL' as const;

    const codes = Array.isArray(latest?.alerts)
      ? latest.alerts.map((alert) => String(alert?.field ?? '')).filter(Boolean)
      : [];

    if (codes.includes('lpReserve0') || codes.includes('lpReserve1')) {
      return 'LIQUIDITY_CRISIS' as const;
    }

    if (codes.includes('riskScore') && Number(latest.scoreDelta) >= 20) {
      return 'HIGH_VOLATILITY' as const;
    }

    if (interactReport) {
      if (interactReport.rewardRunwayDays < 30) return 'REWARD_DRAIN' as const;
      if (interactReport.sustainabilityScore < 40) return 'LOW_RETENTION' as const;
    }

    if (severity === 'WARN') return 'HIGH_VOLATILITY' as const;

    return 'STABLE' as const;
  } catch {
    return 'STABLE' as const;
  }
}

function stableHealthResponse() {
  return {
    signal: 'STABLE' as const,
    alertCount: 0,
    lastAlert: null,
    interactReport: {
      sustainabilityScore: 100,
      rewardRunwayDays: 999,
    },
    timestamp: new Date().toISOString(),
  };
}

function findAlertsPath(deploymentId: string): string | null {
  const candidates = [
    path.join(process.cwd(), '.hydra', deploymentId, 'monitor', 'alerts.json'),
    path.join(process.cwd(), '..', '.hydra', deploymentId, 'monitor', 'alerts.json'),
    path.join(process.cwd(), '..', '..', '.hydra', deploymentId, 'monitor', 'alerts.json'),
    path.join(os.homedir(), '.hydra', deploymentId, 'monitor', 'alerts.json')
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function findLatestInteractReportPath(deploymentId: string): string | null {
  const candidates = [
    path.join(process.cwd(), '.hydra', deploymentId),
    path.join(process.cwd(), '..', '.hydra', deploymentId),
    path.join(process.cwd(), '..', '..', '.hydra', deploymentId),
    path.join(os.homedir(), '.hydra', deploymentId),
  ];

  for (const base of candidates) {
    if (!fs.existsSync(base)) continue;
    const reports = fs
      .readdirSync(base)
      .filter((file) => file.startsWith('interact-') && file.endsWith('.json'))
      .sort()
      .reverse();

    if (reports.length > 0) {
      return path.join(base, reports[0]);
    }
  }

  return null;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(200).json(stableHealthResponse());
  }

  const deploymentId = process.env.DEPLOYMENT_ID;
  if (!deploymentId) {
    return res.status(200).json(stableHealthResponse());
  }

  try {
    const alertsPath = findAlertsPath(deploymentId);
    let alerts: unknown[] = [];

    if (alertsPath) {
      const raw = fs.readFileSync(alertsPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        alerts = parsed;
      }
    }

    let interactReport = {
      sustainabilityScore: 100,
      rewardRunwayDays: 999,
    };

    const interactPath = findLatestInteractReportPath(deploymentId);
    if (interactPath) {
      try {
        const raw = fs.readFileSync(interactPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          interactReport = {
            sustainabilityScore:
              typeof parsed.sustainabilityScore === 'number'
                ? parsed.sustainabilityScore
                : 100,
            rewardRunwayDays:
              typeof parsed.rewardRunwayDays === 'number'
                ? parsed.rewardRunwayDays
                : 999,
          };
        }
      } catch {
        // ignore parse errors and use defaults
      }
    }

    const signal = deriveHealthSignal(alerts as any, interactReport);
    return res.status(200).json({
      signal,
      alertCount: alerts.length,
      lastAlert: alerts[alerts.length - 1] ?? null,
      interactReport,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return res.status(200).json(stableHealthResponse());
  }
}
