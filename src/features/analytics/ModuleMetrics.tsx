"use client";

import { useDashboard } from "@/lib/dashboardContext";
import { getModuleLabelById, getModuleGradientById } from "@/lib/moduleMetadata";

export function ModuleMetrics() {
  const { userMetrics } = useDashboard();

  if (!userMetrics || Object.keys(userMetrics.moduleContributions).length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-6 border border-slate-800 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Module Contributions</h3>
        <div className="text-center text-slate-400 py-8">
          No module data yet. Interact with modules to earn rewards!
        </div>
      </div>
    );
  }

  const sortedModules = Object.entries(userMetrics.moduleContributions)
    .sort(([, a], [, b]) => {
      const aPoints = Number(a.points);
      const bPoints = Number(b.points);
      return bPoints - aPoints;
    });

  const totalModulePoints = sortedModules.reduce(
    (sum, [, contrib]) => sum + Number(contrib.points),
    0
  );

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-6 border border-slate-800 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">📊</span>
        Module Contributions
      </h3>

      <div className="space-y-3">
        {sortedModules.map(([moduleId, contribution]) => {
          const modId = Number(moduleId);
          const moduleName = getModuleLabelById(modId);
          const points = Number(contribution.points);
          const percent = totalModulePoints > 0 ? (points / totalModulePoints) * 100 : 0;
          const gradient = getModuleGradientById(modId);

          return (
            <div key={moduleId} className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-slate-100">{moduleName}</div>
                  <div className="text-xs text-slate-400">
                    {contribution.actionCount} action{contribution.actionCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                    {points.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400">{percent.toFixed(1)}%</div>
                </div>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 bg-gradient-to-r ${gradient} rounded-full transition-all duration-300`}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>

              {contribution.lastAction > 0 && (
                <div className="text-xs text-slate-500 mt-2">
                  Last action: {new Date(contribution.lastAction).toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-slate-800/30 rounded p-2">
            <div className="text-slate-400">Total Modules</div>
            <div className="text-lg font-semibold text-slate-100">{sortedModules.length}</div>
          </div>
          <div className="bg-slate-800/30 rounded p-2">
            <div className="text-slate-400">Module Points</div>
            <div className="text-lg font-semibold text-slate-100">
              {totalModulePoints.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {sortedModules.length >= 3 && (
        <div className="mt-3 bg-green-900/30 border border-green-700 rounded p-3 text-sm text-green-200">
          <strong>🎯 Bonus:</strong> You're earning diversity bonuses by using multiple modules!
        </div>
      )}
    </div>
  );
}
