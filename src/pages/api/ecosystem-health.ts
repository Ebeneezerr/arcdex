import fs from 'fs';
import path from 'path';
import os from 'os';
import { deriveHealthSignal } from '@hydra/dna-engine';
import type { NextApiRequest, NextApiResponse } from 'next';

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
