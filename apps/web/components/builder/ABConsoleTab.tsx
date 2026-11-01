"use client";

import React, { useState } from "react";
import {
  GitCompare,
  Send,
  Sparkles,
  Bot,
  Zap,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { BotConfig, compilePrompt } from "@personaforge/core";

interface ABConsoleTabProps {
  configA: BotConfig;
}

export function ABConsoleTab({ configA }: ABConsoleTabProps) {
  // Variant B can be customized or tweaked (e.g. higher temperature, different tone)
  const [configB, setConfigB] = useState<BotConfig>(() => ({
    ...JSON.parse(JSON.stringify(configA)),
    name: `${configA.name} (Variant B)`,
    runtime: {
      ...configA.runtime,
      temperature: 0.9, // creative variant
      model: "llama-3.1-8b-instant",
    },
  }));

  const [testQuery, setTestQuery] = useState("Explain your services and refund policy.");
  const [responseA, setResponseA] = useState("");
  const [responseB, setResponseB] = useState("");
  const [loading, setLoading] = useState(false);

  const compiledA = compilePrompt(configA, "web");
  const compiledB = compilePrompt(configB, "web");

  const runDualTest = async () => {
    if (!testQuery.trim() || loading) return;
    setLoading(true);
    setResponseA("");
    setResponseB("");

    const fetchStream = async (config: BotConfig, onDelta: (text: string) => void) => {
      try {
        const res = await fetch("/api/preview/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config,
            messages: [{ role: "user", content: testQuery }],
            channel: "web",
          }),
        });

        if (!res.ok || !res.body) {
          onDelta("Error generating preview");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("event: token")) {
              const dataLine = trimmed.split("\n").find((l) => l.startsWith("data:"));
              if (dataLine) {
                try {
                  const parsed = JSON.parse(dataLine.slice(5).trim());
                  if (parsed.text) onDelta(parsed.text);
                } catch {}
              }
            }
          }
        }
      } catch (err) {
        onDelta(`Error: ${String(err)}`);
      }
    };

    let accumA = "";
    let accumB = "";

    await Promise.all([
      fetchStream(configA, (delta) => {
        accumA += delta;
        setResponseA(accumA);
      }),
      fetchStream(configB, (delta) => {
        accumB += delta;
        setResponseB(accumB);
      }),
    ]);

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/70 overflow-y-auto p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">A/B Testing Console</h3>
            <p className="text-xs text-slate-400">
              Benchmark prompt variations and models side-by-side with identical user inputs
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {/* Variant A Summary */}
        <div className="glass-panel p-4 rounded-xl space-y-2 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
              Variant A (Current)
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {configA.runtime?.model}
            </span>
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Tokens:</span>
              <span className="font-mono">{compiledA.tokenEstimate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Temp:</span>
              <span className="font-mono">{configA.runtime?.temperature ?? 0.7}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Blocks:</span>
              <span className="font-mono">{configA.blockOrder?.length || Object.keys(configA.blocks).length}</span>
            </div>
          </div>
        </div>

        {/* Variant B Summary */}
        <div className="glass-panel p-4 rounded-xl space-y-2 border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
              Variant B (Candidate)
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {configB.runtime?.model}
            </span>
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Tokens:</span>
              <span className="font-mono">{compiledB.tokenEstimate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Temp:</span>
              <span className="font-mono">{configB.runtime?.temperature ?? 0.9}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Blocks:</span>
              <span className="font-mono">{configB.blockOrder?.length || Object.keys(configB.blocks).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Input Form */}
      <div className="glass-panel p-4 rounded-xl space-y-3">
        <label className="text-xs font-semibold text-slate-300 block">
          Simultaneous Test Prompt
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Type prompt to send to both bots..."
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={runDualTest}
            disabled={loading || !testQuery.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-glow transition"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Benchmark Both
          </button>
        </div>
      </div>

      {/* Side-by-Side Responses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* Response A */}
        <div className="glass-panel p-4 rounded-xl flex flex-col space-y-2">
          <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 pb-2 border-b border-slate-800">
            <Bot className="w-3.5 h-3.5 text-indigo-400" /> Variant A Response
          </div>
          <div className="flex-1 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono min-h-[140px]">
            {responseA || (loading ? "Generating response..." : "Click Benchmark Both to run test")}
          </div>
        </div>

        {/* Response B */}
        <div className="glass-panel p-4 rounded-xl flex flex-col space-y-2">
          <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5 pb-2 border-b border-slate-800">
            <Bot className="w-3.5 h-3.5 text-cyan-400" /> Variant B Response
          </div>
          <div className="flex-1 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono min-h-[140px]">
            {responseB || (loading ? "Generating response..." : "Click Benchmark Both to run test")}
          </div>
        </div>
      </div>
    </div>
  );
}
