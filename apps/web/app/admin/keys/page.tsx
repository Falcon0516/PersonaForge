"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Clock,
  Zap,
  Activity,
  RotateCcw,
  KeyRound,
  AlertTriangle,
} from "lucide-react";

interface KeyStatus {
  alias: string;
  status: "healthy" | "cooling" | "dead";
  cooldownRemainingSeconds: number;
  requestsLastHour: number;
  rateLimitsLastHour: number;
}

export default function AdminKeysPage() {
  const [keys, setKeys] = useState<KeyStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch {
      // Ignore network errors in polling
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStatus]);

  const handleAction = async (action: string, keyIndex?: number) => {
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, keyIndex }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || "Action successful");
        setTimeout(() => setActionMessage(null), 3000);
        fetchStatus();
      }
    } catch (err) {
      setActionMessage(`Error: ${String(err)}`);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const healthyCount = keys.filter((k) => k.status === "healthy").length;
  const coolingCount = keys.filter((k) => k.status === "cooling").length;
  const deadCount = keys.filter((k) => k.status === "dead").length;

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Groq Key Pool Telemetry
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  k1–k10 Zero-Leak Pool
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Real-time round-robin load distribution, 429 backoff cooldowns, and failover state
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fetchStatus()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer bg-slate-900/60 px-3.5 py-2 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
            />
            Auto-refresh (5s)
          </label>

          <button
            onClick={() => handleAction("reset-all")}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All Cooldowns
          </button>
        </div>
      </header>

      {/* Action Notification */}
      {actionMessage && (
        <div className="mt-4 p-3 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-sm flex items-center justify-between animate-fade-in">
          <span>{actionMessage}</span>
          <span className="text-xs opacity-75">{lastUpdated}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
        <div className="glass-panel p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Keys
            </span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold mt-2 text-white">{keys.length}</div>
          <div className="text-xs text-slate-500 mt-1">Configured in pool (max 10)</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border-emerald-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Healthy
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold mt-2 text-emerald-300">{healthyCount}</div>
          <div className="text-xs text-emerald-500/80 mt-1">Ready for requests</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border-amber-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Cooling
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold mt-2 text-amber-300">{coolingCount}</div>
          <div className="text-xs text-amber-500/80 mt-1">Backing off after 429</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border-rose-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Dead / Revoked
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold mt-2 text-rose-300">{deadCount}</div>
          <div className="text-xs text-rose-500/80 mt-1">HTTP 401/403 invalid</div>
        </div>
      </section>

      {/* Keys Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Pool Members</h2>
          <span className="text-xs text-slate-500">Updated: {lastUpdated || "Just now"}</span>
        </div>

        {keys.length === 0 ? (
          <div className="glass-panel p-8 rounded-xl text-center text-slate-400">
            <KeyRound className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No keys currently loaded in the pool.</p>
            <p className="text-xs mt-1 text-slate-500">
              Provide comma-separated GROQ_API_KEYS in your environment file.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {keys.map((k, idx) => {
              const keyNum = idx + 1;
              return (
                <div
                  key={k.alias}
                  className={`glass-panel p-5 rounded-xl transition border ${
                    k.status === "healthy"
                      ? "border-emerald-500/20 hover:border-emerald-500/40"
                      : k.status === "cooling"
                      ? "border-amber-500/30 hover:border-amber-500/50"
                      : "border-rose-500/30 hover:border-rose-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-mono text-white bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                        {k.alias}
                      </span>
                      <span className="text-xs text-slate-400">Slot #{keyNum}</span>
                    </div>

                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                        k.status === "healthy"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : k.status === "cooling"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse"
                          : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          k.status === "healthy"
                            ? "bg-emerald-400"
                            : k.status === "cooling"
                            ? "bg-amber-400"
                            : "bg-rose-400"
                        }`}
                      />
                      {k.status}
                    </span>
                  </div>

                  {/* Cooldown bar if cooling */}
                  {k.status === "cooling" && (
                    <div className="mb-4 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Cooldown active
                      </span>
                      <span className="font-mono font-bold">
                        {k.cooldownRemainingSeconds}s remaining
                      </span>
                    </div>
                  )}

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-800/80 my-3">
                    <div>
                      <span className="text-slate-400 block">Reqs (1h)</span>
                      <span className="text-sm font-semibold text-slate-200 mt-0.5 block">
                        {k.requestsLastHour}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">429s (1h)</span>
                      <span
                        className={`text-sm font-semibold mt-0.5 block ${
                          k.rateLimitsLastHour > 0 ? "text-amber-400" : "text-slate-400"
                        }`}
                      >
                        {k.rateLimitsLastHour}
                      </span>
                    </div>
                  </div>

                  {/* Individual Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    {k.status === "cooling" && (
                      <button
                        onClick={() => handleAction("reset-cooldown", keyNum)}
                        className="flex-1 py-1.5 text-xs font-medium rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition text-center"
                      >
                        Clear Cooldown
                      </button>
                    )}
                    {k.status === "dead" && (
                      <button
                        onClick={() => handleAction("revive-dead", keyNum)}
                        className="flex-1 py-1.5 text-xs font-medium rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 transition text-center"
                      >
                        Revive Key
                      </button>
                    )}
                    {k.status === "healthy" && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" /> Active in round-robin cycle
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Vendor Limits Notice */}
      <footer className="mt-12 p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-slate-200 mb-0.5">
            Architecture Notice: Groq Per-Org Rate Limits
          </div>
          PersonaForge maintains a client-side key pool with automatic round-robin, Redis cooldown state, and fallback model cascading. Note that Groq rate limits are calculated per organization; multiple keys from the same account share token/request limits. For high production throughput, configure fallback models or multiple organizations.
        </div>
      </footer>
    </div>
  );
}
