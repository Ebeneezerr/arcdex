"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "@/lib/dashboardContext";
import {
  getModuleGradientById,
  getModuleIconById,
  getModuleLabelById,
} from "@/lib/moduleMetadata";

interface ModuleMetric {
  moduleId: number;
  moduleName: string;
  points: string;
  adjustedPoints: string;
  actionCount: number;
  lastAction: string | null;
  qualityFactor: number;
  averagePointsPerAction: string;
}

interface ModuleMetricsData {
  userAddress: string;
  totalModules: number;
  activeModules: number;
  diversityBonus: string;
  modules: ModuleMetric[];
  totalPoints: string;
  qualityFactorOverview: {
    highest: ModuleMetric | null;
    average: string;
  };
}

export function ModuleMetricsWidget() {
  const { userAddress } = useDashboard();
  const [moduleMetrics, setModuleMetrics] = useState<ModuleMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);

  const fetchModuleMetrics = async () => {
    if (!userAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/module-metrics?user=${userAddress}`);

      if (response.ok) {
        const data = await response.json();
        setModuleMetrics(data.data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch module metrics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModuleMetrics();
    const interval = setInterval(fetchModuleMetrics, 45000); // Refresh every 45 seconds
    return () => clearInterval(interval);
  }, [userAddress]);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg p-6 border border-slate-800 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Module Performance
        </h3>
        {moduleMetrics && (
          <div className="text-sm text-slate-400">
            {moduleMetrics.activeModules} active modules
          </div>
        )}
      </div>

      {moduleMetrics && Number(moduleMetrics.diversityBonus) > 1.0 && (
        <div className="mb-6 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border border-emerald-700 rounded-lg p-3">
          <div className="flex items-center gap-2 text-emerald-300">
            <span className="text-lg">🎁</span>
            <div>
              <div className="font-semibold text-sm">Diversity Bonus Active!</div>
              <div className="text-xs opacity-90">
                +{((Number(moduleMetrics.diversityBonus) - 1) * 100).toFixed(1)}% bonus for
                interacting with {moduleMetrics.activeModules} modules
              </div>
            </div>
          </div>
        </div>
      )}

      {moduleMetrics && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800/50 rounded p-3">
            <div className="text-xs text-slate-400 mb-1">Total Modules</div>
            <div className="text-2xl font-bold text-white">{moduleMetrics.totalModules}</div>
          </div>
          <div className="bg-slate-800/50 rounded p-3">
            <div className="text-xs text-slate-400 mb-1">Avg Quality Factor</div>
            <div className="text-2xl font-bold text-white">
              {moduleMetrics.qualityFactorOverview.average}x
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-6 text-slate-400">Loading module metrics...</div>
        ) : error ? (
          <div className="text-center py-6 text-red-400">{error}</div>
        ) : moduleMetrics && moduleMetrics.modules.length === 0 ? (
          <div className="text-center py-6 text-slate-400">No module activity yet</div>
        ) : (
          moduleMetrics?.modules.map((module) => {
            const color = getModuleGradientById(module.moduleId);
            const icon = getModuleIconById(module.moduleId);
            const moduleLabel = getModuleLabelById(module.moduleId);

            return (
              <div
                key={module.moduleId}
                className={`bg-gradient-to-r ${color} rounded-lg p-4 cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() =>
                  setExpandedModule(
                    expandedModule === module.moduleId ? null : module.moduleId
                  )
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">{moduleLabel}</div>
                      <div className="text-xs text-white/70">
                        {module.actionCount} actions • {module.qualityFactor.toFixed(1)}x multiplier
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white text-sm">{module.points}</div>
                    <div className="text-xs text-white/70">points</div>
                  </div>
                </div>

                {expandedModule === module.moduleId && (
                  <div className="mt-4 pt-4 border-t border-white/20 space-y-2 text-sm text-white/90">
                    <div className="flex justify-between">
                      <span>Adjusted Points:</span>
                      <span className="font-semibold">{module.adjustedPoints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Points/Action:</span>
                      <span className="font-semibold">{module.averagePointsPerAction}</span>
                    </div>
                    {module.lastAction && (
                      <div className="flex justify-between">
                        <span>Last Action:</span>
                        <span className="font-semibold">
                          {new Date(module.lastAction).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {moduleMetrics && moduleMetrics.qualityFactorOverview.highest && (
        <div className="mt-6 pt-6 border-t border-slate-700 text-sm text-slate-400">
          <div className="mb-2 font-semibold text-slate-300">Top Module</div>
          <div className="flex justify-between items-center">
            <span>{getModuleLabelById(moduleMetrics.qualityFactorOverview.highest.moduleId)}</span>
            <span className="text-amber-400 font-semibold">
              {moduleMetrics.qualityFactorOverview.highest.points} points
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
