"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus, Check, Zap, Layers, X, GripVertical } from "lucide-react";
import { getAllBlocks, CATEGORIES, CategoryId, BlockDef } from "@personaforge/core";

interface BlockPaletteProps {
  canvasBlockIds: string[];
  botMode: "chat" | "voice";
  onAddBlock: (blockId: string) => void;
}

export function BlockPalette({
  canvasBlockIds,
  botMode,
  onAddBlock,
}: BlockPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");

  const allBlocks = useMemo(() => getAllBlocks(), []);

  const filteredBlocks = useMemo(() => {
    return allBlocks.filter((b: BlockDef<any>) => {
      // Filter by bot mode
      if (!b.modes.includes(botMode)) return false;

      // Filter by category
      if (selectedCat !== "all" && b.category !== selectedCat) return false;

      // Filter by search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = b.label.toLowerCase().includes(q);
        const matchDesc = b.description.toLowerCase().includes(q);
        const matchId = b.id.toLowerCase().includes(q);
        const matchCat = b.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchId && !matchCat) return false;
      }

      return true;
    });
  }, [allBlocks, botMode, selectedCat, search]);

  return (
    <div className="flex flex-col h-full bg-slate-950/60 border-r border-slate-800">
      {/* Palette Header */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Block Palette
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {filteredBlocks.length} available
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search blocks, rules, tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          <button
            onClick={() => setSelectedCat("all")}
            className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
              selectedCat === "all"
                ? "bg-indigo-600 text-white font-medium"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat: CategoryId) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-2.5 py-1 rounded-md transition whitespace-nowrap capitalize ${
                selectedCat === cat
                  ? "bg-indigo-600 text-white font-medium"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Block List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredBlocks.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No matching blocks found.
          </div>
        ) : (
          filteredBlocks.map((block: BlockDef<any>) => {
            const isAdded = canvasBlockIds.includes(block.id);
            return (
              <div
                key={block.id}
                draggable={!isAdded}
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/personaforge-block", block.id);
                  e.dataTransfer.setData("text/plain", block.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className={`group p-3 rounded-xl border transition-all duration-150 space-y-2 select-none ${
                  isAdded
                    ? "bg-slate-900/30 border-slate-800/40 opacity-70 cursor-default"
                    : "bg-slate-900/70 hover:bg-slate-900 border-slate-800/80 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 cursor-grab active:cursor-grabbing hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    {!isAdded ? (
                      <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 flex-shrink-0 mt-0.5 transition" />
                    ) : (
                      <div className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition">
                          {block.label}
                        </span>
                        {!isAdded && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 opacity-0 group-hover:opacity-100 transition">
                            drag to canvas
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {block.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onAddBlock(block.id)}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition ${
                      isAdded
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 cursor-default"
                        : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white cursor-pointer"
                    }`}
                    title={isAdded ? "Added to canvas" : "Click to add or drag to canvas"}
                  >
                    {isAdded ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                  <span className="font-mono text-slate-400 capitalize">
                    {block.category.replace(/_/g, " ")}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-amber-400/80">
                    <Zap className="w-2.5 h-2.5 text-amber-400" /> p:{block.priority}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
