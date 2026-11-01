"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Sparkles,
  Layers,
  Terminal,
  Award,
  Share2,
  Plus,
  ArrowRight,
} from "lucide-react";
import { getAllBlocks, BlockDef } from "@personaforge/core";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: "preview" | "prompt" | "score" | "ab") => void;
  onAddBlock: (blockId: string) => void;
  onOpenMagicBox: () => void;
  onOpenTemplates: () => void;
  onOpenPublish: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigateTab,
  onAddBlock,
  onOpenMagicBox,
  onOpenTemplates,
  onOpenPublish,
  onUndo,
  onRedo,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const allBlocks = getAllBlocks();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredBlocks = allBlocks
    .filter(
      (b: BlockDef<any>) =>
        b.label.toLowerCase().includes(query.toLowerCase()) ||
        b.category.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-xl rounded-2xl border-indigo-500/30 shadow-2xl overflow-hidden space-y-2">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/60">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Type a command or block name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-0 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {/* Action Commands */}
          <div className="text-[10px] font-semibold text-slate-500 uppercase px-3 py-1">
            Actions & Tabs
          </div>

          <button
            onClick={() => {
              onOpenMagicBox();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition text-left"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Magic Box AI Bot Generator
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          </button>

          <button
            onClick={() => {
              onOpenTemplates();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition text-left"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Browse 12 Industry Templates
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          </button>

          <button
            onClick={() => {
              onNavigateTab("prompt");
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition text-left"
          >
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" /> View Compiled Prompt & Trace
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          </button>

          <button
            onClick={() => {
              onNavigateTab("score");
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition text-left"
          >
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" /> Audit Quality Score
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          </button>

          <button
            onClick={() => {
              onOpenPublish();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition text-left"
          >
            <span className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-violet-400" /> Publish & Export (HTML, Embed, WhatsApp)
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          </button>

          {/* Block quick insertion */}
          {filteredBlocks.length > 0 && (
            <>
              <div className="text-[10px] font-semibold text-slate-500 uppercase px-3 py-1 pt-2">
                Quick Add Block
              </div>
              {filteredBlocks.map((b: BlockDef<any>) => (
                <button
                  key={b.id}
                  onClick={() => {
                    onAddBlock(b.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-900 transition text-left"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Plus className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>Add {b.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({b.category})</span>
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono">p:{b.priority}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
