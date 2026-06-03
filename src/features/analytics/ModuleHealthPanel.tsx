"use client";

import { useMemo } from "react";
import { useDashboard } from "@/lib/dashboardContext";
import { getActiveAstroDEXModuleMetadata, getAstroDEXVerificationReport } from "@/lib/dexConfig";

const moduleVerificationMap: Record<string, string> = {
  faucet: "Faucet",
  staking: "StakingRewards",
  yieldFarming: "YieldFarm",
  lending: "LendingPool",
  copyTrading: "CopyTrading",
  demoTrading: "DemoTrading",
  bridge: "CCIPBridge",
  governance: "PointsTracker",
  nftMarketplace: "AstroDEXMarketplace",
};

function getActivityLabel(actions: number): string {
  if (actions >= 50) return "High";
  if (actions >= 15) return "Medium";
  if (actions > 0) return "Low";
  return "Idle";
}

export function ModuleHealthPanel() {
  const { aggregatedMetrics } = useDashboard();
  const activeModules = getActiveAstroDEXModuleMetadata();
  const verification = getAstroDEXVerificationReport();

  const rows = useMemo(
    () =>
      activeModules.map((module) => {
        const breakdown = aggregatedMetrics?.moduleBreakdown?.[module.id];
        const actions = breakdown?.actionCount ?? 0;
        const points = breakdown?.totalPoints ?? 0n;
        const matchedName = moduleVerificationMap[module.key];
        const verificationResult = verification?.results.find(
          (result) => result.name === matchedName || result.contractName === matchedName
        );
        const status = verificationResult
          ? verificationResult.passed
            ? "Healthy"
            : "Attention"
          : "Pending";

        return {
          ...module,
          status,
          activity: getActivityLabel(actions),
          points,
          actions,
          verificationResult,
        };
      }),
    [activeModules, aggregatedMetrics, verification]
  );

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-6 border border-slate-800 shadow-lg">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-white">🩺 Module Health Panel</h3>
          <p className="text-sm text-slate-400">
            Combined deployment verification and module activity status.
          </p>
        </div>
        <div className="text-xs text-slate-500 text-right">
          <div>Verified: {verification?.passedContracts ?? 0}/{verification?.totalContracts ?? 0}</div>
          <div>{verification?.valid ? "Overall healthy" : "Attention recommended"}</div>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((module) => (
          <div key={module.key} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-white font-semibold text-sm">{module.icon} {module.label}</div>
                <div className="text-xs text-slate-400">{module.description}</div>
              </div>
              <div className="text-right">
                <div className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                  module.status === "Healthy"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : module.status === "Attention"
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-slate-700/60 text-slate-300"
                }`}>
                  {module.status}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-300">
              <div className="bg-slate-900/50 rounded p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Activity</div>
                <div className="mt-1 font-semibold">{module.activity}</div>
              </div>
              <div className="bg-slate-900/50 rounded p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Points</div>
                <div className="mt-1 font-semibold">{(module.points / 1000n).toString()}k</div>
              </div>
              <div className="bg-slate-900/50 rounded p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Actions</div>
                <div className="mt-1 font-semibold">{module.actions}</div>
              </div>
            </div>

            {module.verificationResult && (
              <div className="mt-3 text-xs text-slate-400 bg-slate-950/60 rounded p-3 border border-slate-800">
                <div>
                  Verification: <span className={module.verificationResult.passed ? "text-emerald-300" : "text-amber-300"}>
                    {module.verificationResult.passed ? "Passed" : "Failed"}
                  </span>
                </div>
                <div className="mt-1">Contract: {module.verificationResult.contractName}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
