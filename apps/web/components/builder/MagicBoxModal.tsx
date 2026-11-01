"use client";

import React, { useState } from "react";
import { Sparkles, X, Loader2, ArrowRight } from "lucide-react";
import { BotConfig } from "@personaforge/core";

interface MagicBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyConfig: (config: BotConfig) => void;
}

const EXAMPLE_PROMPTS = [
  "A Hindi-speaking agricultural assistant for wheat and mustard farmers in Haryana.",
  "An empathetic e-commerce return & refund specialist with strict fraud prevention.",
  "A concise tier-1 SaaS DevOps helpdesk bot for Kubernetes and Docker triage.",
  "A high-empathy pediatric clinic receptionist voice agent.",
  "A luxury real estate property consultant in Mumbai with bilingual Hindi-English fluency.",
];

export function MagicBoxModal({ isOpen, onClose, onApplyConfig }: MagicBoxModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/bots/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.config) {
        throw new Error(data.error || "Failed to generate bot configuration");
      }

      onApplyConfig(data.config);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-xl rounded-2xl p-6 border-indigo-500/30 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Magic Box AI Bot Generator</h3>
              <p className="text-xs text-slate-400">
                Describe your desired bot in one natural sentence. PersonaForge configures all blocks.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Bot Narrative or Mission
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A friendly financial advisor bot for young professionals investing in index funds..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Examples */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-slate-400 block">
            Or try an example prompt:
          </span>
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(ex)}
                className="text-left text-[11px] p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800/80 transition flex items-center justify-between group"
              >
                <span className="truncate">{ex}</span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs shadow-glow transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Persona
          </button>
        </div>
      </div>
    </div>
  );
}
