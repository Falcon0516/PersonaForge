"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Download,
  Calendar,
  Users,
  MessageSquare,
  Clock,
  Shield,
  Zap,
  TrendingUp,
  Globe,
  Mic,
  CheckCircle,
} from "lucide-react";
import {
  agricultureTemplate,
  getTemplateById,
  getTemplateBySlug,
  BotConfig,
} from "@personaforge/core";

interface ConversationLog {
  id: string;
  userHash: string;
  channel: "web" | "whatsapp" | "voice";
  query: string;
  responsePreview: string;
  tokens: number;
  latencyMs: number;
  timestamp: string;
  sentiment: "positive" | "neutral" | "negative";
}

const SAMPLE_LOGS: ConversationLog[] = [
  {
    id: "log-1",
    userHash: "usr_7f3b89",
    channel: "whatsapp",
    query: "Tamatar ka aaj ka mandi bhav kya hai?",
    responsePreview: "Namaste! Aaj Azadpur mandi me tamatar 25-30 Rs/kg chal raha hai...",
    tokens: 184,
    latencyMs: 380,
    timestamp: "10 mins ago",
    sentiment: "positive",
  },
  {
    id: "log-2",
    userHash: "usr_4a1c92",
    channel: "voice",
    query: "Pattiya pili pad rahi hai gehu me, kya kare?",
    responsePreview: "Gehu me pili pattiya nitrogen kami ya yellow rust ka lakshan ho sakti hai...",
    tokens: 240,
    latencyMs: 440,
    timestamp: "28 mins ago",
    sentiment: "positive",
  },
  {
    id: "log-3",
    userHash: "usr_9b3e14",
    channel: "web",
    query: "What are the requirements for PM Kisan subsidy?",
    responsePreview: "Under PM-Kisan Samman Nidhi, eligible farmers receive ₹6,000 annually...",
    tokens: 310,
    latencyMs: 410,
    timestamp: "1 hour ago",
    sentiment: "positive",
  },
  {
    id: "log-4",
    userHash: "usr_2d8f61",
    channel: "whatsapp",
    query: "Direct harvest sell kaise kare?",
    responsePreview: "Aap apna harvest list karne ke liye quantity aur expected price bataye...",
    tokens: 195,
    latencyMs: 360,
    timestamp: "2 hours ago",
    sentiment: "positive",
  },
  {
    id: "log-5",
    userHash: "usr_6c7a33",
    channel: "web",
    query: "Weather forecast for next 3 days",
    responsePreview: "Partly cloudy with light showers expected on Wednesday...",
    tokens: 160,
    latencyMs: 390,
    timestamp: "3 hours ago",
    sentiment: "neutral",
  },
];

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const botId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || "draft";

  const botConfig: BotConfig =
    getTemplateById(botId)?.config ||
    getTemplateBySlug(botId)?.config ||
    agricultureTemplate.config;

  const [autoPurge, setAutoPurge] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const exportCSV = () => {
    const headers = ["Log ID", "User Hash", "Channel", "User Query", "Tokens", "Latency (ms)", "Timestamp"];
    const rows = SAMPLE_LOGS.map((l) => [
      l.id,
      l.userHash,
      l.channel,
      `"${l.query.replace(/"/g, '""')}"`,
      l.tokens,
      l.latencyMs,
      `"${l.timestamp}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `personaforge-${botConfig.slug}-analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/80 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/builder/${botId}`)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Builder</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Telemetry & Analytics &bull; {botConfig.name}
          </h1>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow transition"
        >
          {downloadSuccess ? <CheckCircle className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
          <span>{downloadSuccess ? "Exported!" : "Export CSV"}</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8 space-y-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
              <span>Total Conversations</span>
              <MessageSquare className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-1">1,482</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +18.4% this week
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
              <span>Tokens Processed</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-1">312.4K</div>
            <div className="text-[11px] text-slate-500 mt-1">Avg 210 tok/turn</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
              <span>Average Latency</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-1">395ms</div>
            <div className="text-[11px] text-emerald-400 mt-1">Groq LPUs blazing fast</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
              <span>Satisfaction Score</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-1">96.8%</div>
            <div className="text-[11px] text-slate-500 mt-1">Based on 👍 thumbs feedback</div>
          </div>
        </div>

        {/* Channel Distribution & Privacy Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Channel Share */}
          <div className="glass-panel p-5 rounded-2xl md:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Channel Traffic Breakdown
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" /> Web Widget & Hosted Page
                  </span>
                  <span className="font-mono text-slate-400 font-semibold">54% (800 reqs)</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: "54%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Sandbox (/use {botConfig.slug.slice(0, 5)})
                  </span>
                  <span className="font-mono text-slate-400 font-semibold">32% (474 reqs)</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "32%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Mic className="w-3.5 h-3.5 text-violet-400" /> Voice Agent (BulBul v3 + Saarika v2.5)
                  </span>
                  <span className="font-mono text-slate-400 font-semibold">14% (208 reqs)</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-violet-500 h-full rounded-full" style={{ width: "14%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Retention Controls */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Privacy & Retention
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              PersonaForge protects user privacy. Phone numbers and IP addresses are cryptographically hashed using salted SHA-256 before telemetry logging.
            </p>

            <div className="pt-2 border-t border-slate-800 space-y-3">
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>Auto-purge logs after 30 days</span>
                <input
                  type="checkbox"
                  checked={autoPurge}
                  onChange={(e) => setAutoPurge(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
              </label>
              <div className="text-[11px] text-slate-500">
                Retention scheduler active: Next purge in 6 days.
              </div>
            </div>
          </div>
        </div>

        {/* Live Conversation Stream Table */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 space-y-0">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Recent Interaction Logs
            </h3>
            <span className="text-xs text-slate-500">Showing last 5 interactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3.5 pl-5">User</th>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">User Prompt</th>
                  <th className="p-3.5">Tokens</th>
                  <th className="p-3.5">Latency</th>
                  <th className="p-3.5 pr-5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {SAMPLE_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3.5 pl-5 text-indigo-300 font-semibold">{log.userHash}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-sans ${
                          log.channel === "whatsapp"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : log.channel === "voice"
                            ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                            : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                        }`}
                      >
                        {log.channel}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-200 font-sans max-w-xs truncate">{log.query}</td>
                    <td className="p-3.5 text-amber-400">{log.tokens}</td>
                    <td className="p-3.5 text-slate-400">{log.latencyMs}ms</td>
                    <td className="p-3.5 pr-5 text-slate-500 font-sans">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
