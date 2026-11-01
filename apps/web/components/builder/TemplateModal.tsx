"use client";

import React, { useState } from "react";
import { BookOpen, X, ArrowRight, Zap, Check } from "lucide-react";
import { getAllTemplates, TemplatePreset, BotConfig } from "@personaforge/core";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (config: BotConfig) => void;
}

export function TemplateModal({ isOpen, onClose, onSelectTemplate }: TemplateModalProps) {
  const templates = getAllTemplates();
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");

  if (!isOpen) return null;

  const industries = Array.from(new Set(templates.map((t) => t.industry)));

  const filtered = templates.filter(
    (t) => selectedIndustry === "all" || t.industry === selectedIndustry
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-4xl max-h-[85vh] rounded-2xl flex flex-col border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Production Template Presets</h3>
              <p className="text-xs text-slate-400">
                Jumpstart your persona with 12 battle-tested domain architectures
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Industry Filter Bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setSelectedIndustry("all")}
            className={`px-3 py-1 rounded-md transition whitespace-nowrap ${
              selectedIndustry === "all"
                ? "bg-indigo-600 text-white font-medium"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            All Industries ({templates.length})
          </button>
          {industries.map((ind) => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(ind)}
              className={`px-3 py-1 rounded-md transition whitespace-nowrap capitalize ${
                selectedIndustry === ind
                  ? "bg-indigo-600 text-white font-medium"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t: TemplatePreset) => {
            const blockCount = t.config.blockOrder?.length || Object.keys(t.config.blocks).length;
            return (
              <div
                key={t.id}
                className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition duration-150 flex flex-col justify-between space-y-3 group hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      {t.industry}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {blockCount} blocks
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                    {t.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500 capitalize">
                    {t.config.mode} Mode
                  </span>
                  <button
                    onClick={() => {
                      onSelectTemplate(t.config);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition"
                  >
                    <span>Use Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
