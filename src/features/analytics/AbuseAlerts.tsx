"use client";

import { useDashboard } from "@/lib/dashboardContext";

const ALERT_EMOJIS: Record<string, string> = {
  multi_wallet_faucet: "🚨",
  rapid_actions: "⚡",
  suspicious_transfer: "🔄",
  low_reputation: "⚠️",
  point_anomaly: "📊",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-blue-900/30 border-blue-700 text-blue-200",
  medium: "bg-yellow-900/30 border-yellow-700 text-yellow-200",
  high: "bg-red-900/30 border-red-700 text-red-200",
};

const SEVERITY_BADGES: Record<string, string> = {
  low: "bg-blue-600 text-blue-100",
  medium: "bg-yellow-600 text-yellow-100",
  high: "bg-red-600 text-red-100",
};

export function AbuseAlerts() {
  const { recentAlerts } = useDashboard();

  if (recentAlerts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-900 to-green-950 rounded-lg p-6 border border-green-800 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">✅</span>
          Security Status
        </h3>
        <div className="text-center py-6">
          <div className="text-2xl mb-2">🛡️</div>
          <div className="text-green-200 font-semibold">No alerts detected</div>
          <div className="text-sm text-green-300 mt-2">Your account is in good standing</div>
        </div>
      </div>
    );
  }

  const highSeverityAlerts = recentAlerts.filter((a) => a.severity === "high");
  const mediumSeverityAlerts = recentAlerts.filter((a) => a.severity === "medium");

  return (
    <div className="bg-gradient-to-br from-red-900 to-red-950 rounded-lg p-6 border border-red-800 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">🚨</span>
        Security Alerts
      </h3>

      {/* Alert Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-red-800/50 rounded p-3 text-center">
          <div className="text-2xl font-bold text-red-200">{highSeverityAlerts.length}</div>
          <div className="text-xs text-red-300">High</div>
        </div>
        <div className="bg-yellow-800/50 rounded p-3 text-center">
          <div className="text-2xl font-bold text-yellow-200">{mediumSeverityAlerts.length}</div>
          <div className="text-xs text-yellow-300">Medium</div>
        </div>
        <div className="bg-blue-800/50 rounded p-3 text-center">
          <div className="text-2xl font-bold text-blue-200">{recentAlerts.length}</div>
          <div className="text-xs text-blue-300">Total</div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {recentAlerts.map((alert, idx) => (
          <div
            key={`${alert.timestamp}-${idx}`}
            className={`border rounded-lg p-3 space-y-2 ${SEVERITY_COLORS[alert.severity]}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                <span className="text-xl mt-1">{ALERT_EMOJIS[alert.alertType] || "⚠️"}</span>
                <div className="flex-1">
                  <div className="font-semibold">{alert.description}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${SEVERITY_BADGES[alert.severity]}`}>
                {alert.severity.toUpperCase()}
              </span>
            </div>

            {/* Evidence */}
            {alert.evidence.length > 0 && (
              <div className="text-xs opacity-75 pl-8">
                <strong>Evidence:</strong>
                <ul className="list-disc list-inside mt-1">
                  {alert.evidence.slice(0, 3).map((e, i) => (
                    <li key={i} className="truncate">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div className="mt-4 pt-4 border-t border-red-700">
        <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors">
          Review Details
        </button>
      </div>
    </div>
  );
}
