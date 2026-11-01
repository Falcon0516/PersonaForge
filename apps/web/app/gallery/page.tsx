"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Search,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Mic,
  Zap,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { getAllTemplates, TemplatePreset } from "@personaforge/core";

export default function GalleryPage() {
  const router = useRouter();
  const templates = useMemo(() => getAllTemplates(), []);

  const [search, setSearch] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedMode, setSelectedMode] = useState<string>("all");

  const industries = useMemo(() => {
    return Array.from(new Set(templates.map((t) => t.industry)));
  }, [templates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (selectedIndustry !== "all" && t.industry !== selectedIndustry) return false;
      if (selectedMode !== "all" && t.config.mode !== selectedMode) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = t.name.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchInd = t.industry.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchInd) return false;
      }
      return true;
    });
  }, [templates, selectedIndustry, selectedMode, search]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 px-6 md:px-10 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-glow">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-white font-bold text-sm">
              PF
            </div>
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            PersonaForge Gallery
          </span>
        </a>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/builder/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-glow transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Studio Builder</span>
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="py-12 px-6 md:px-10 text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-mono">
          <BookOpen className="w-3.5 h-3.5" /> 12 Domain-Hardened AI Persona Blueprints
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Production AI Chat & Voice Agents
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Select any blueprint below to inspect its modular blocks, test live streaming in your browser, or customize in the Studio Builder.
        </p>

        {/* Search Bar */}
        <div className="pt-4 max-w-xl mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search agriculture, healthcare, e-commerce, triage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none shadow-lg transition"
            />
          </div>
        </div>

        {/* Industry & Mode Filter Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-2 text-xs">
          <button
            onClick={() => setSelectedIndustry("all")}
            className={`px-3 py-1.5 rounded-full transition capitalize ${
              selectedIndustry === "all"
                ? "bg-indigo-600 text-white font-semibold"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            All Industries
          </button>
          {industries.map((ind) => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(ind)}
              className={`px-3 py-1.5 rounded-full transition capitalize ${
                selectedIndustry === ind
                  ? "bg-indigo-600 text-white font-semibold"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </section>

      {/* Gallery Cards Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t: TemplatePreset) => {
            const blockCount = t.config.blockOrder?.length || Object.keys(t.config.blocks).length;
            return (
              <div
                key={t.id}
                className="glass-panel p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition duration-200 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-semibold">
                      {t.industry}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      {t.config.mode === "voice" ? (
                        <Mic className="w-3.5 h-3.5 text-violet-400" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      <span className="capitalize">{t.config.mode}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                    {t.name}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {t.description}
                  </p>

                  {/* Chips Preview */}
                  {t.suggestedChips && t.suggestedChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {t.suggestedChips.slice(0, 3).map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full truncate max-w-[160px]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">
                    {blockCount} modular blocks
                  </span>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/b/${t.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Live Test Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          localStorage.setItem(`pf_bot_${t.id}`, JSON.stringify(t.config));
                        }
                        router.push(`/builder/${t.id}`);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition"
                    >
                      <span>Customize</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
