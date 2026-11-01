"use client";

import React, { useState } from "react";
import {
  Undo2,
  Redo2,
  Sparkles,
  Shuffle,
  History,
  Share2,
  Check,
  Cloud,
  CloudOff,
  Edit2,
  Cpu,
  Mic,
  MessageSquare,
} from "lucide-react";
import { BotConfig } from "@personaforge/core";

interface BuilderHeaderProps {
  config: BotConfig;
  saveStatus: "saved" | "saving" | "unsaved";
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onUpdateMetadata: (name: string, slug: string) => void;
  onToggleMode: (mode: "chat" | "voice") => void;
  onOpenMagicBox: () => void;
  onRemix: () => void;
  onOpenVersions: () => void;
  onOpenPublish: () => void;
}

export function BuilderHeader({
  config,
  saveStatus,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onUpdateMetadata,
  onToggleMode,
  onOpenMagicBox,
  onRemix,
  onOpenVersions,
  onOpenPublish,
}: BuilderHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(config.name);
  const [slugVal, setSlugVal] = useState(config.slug);

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (nameVal.trim()) {
      const sanitizedSlug = slugVal.trim()
        ? slugVal.toLowerCase().replace(/[^a-z0-9-]/g, "-")
        : nameVal.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 30);
      onUpdateMetadata(nameVal.trim(), sanitizedSlug);
    }
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 px-4 flex items-center justify-between gap-3 select-none">
      {/* Left: Brand, Editable Name & Mode Switcher */}
      <div className="flex items-center gap-3 min-w-0">
        <a href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-glow">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-white font-bold text-sm group-hover:bg-transparent transition">
              PF
            </div>
          </div>
          <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
            PersonaForge
          </span>
        </a>

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        {/* Editable Name & Slug */}
        <div className="flex items-center gap-2 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameBlur();
                }}
                autoFocus
                className="bg-slate-900 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
              />
            </div>
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-1.5 hover:bg-slate-900 px-2 py-1 rounded-lg text-left group transition"
            >
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate max-w-[160px] sm:max-w-[240px]">
                {config.name}
              </span>
              <span className="text-[10px] font-mono text-slate-500 hidden md:inline">
                /{config.slug}
              </span>
              <Edit2 className="w-3 h-3 text-slate-600 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition" />
            </button>
          )}

          {/* Mode Badge / Switcher */}
          <button
            onClick={() => onToggleMode(config.mode === "chat" ? "voice" : "chat")}
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 transition ${
              config.mode === "voice"
                ? "bg-violet-500/15 text-violet-300 border-violet-500/30 hover:bg-violet-500/25"
                : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25"
            }`}
            title="Click to toggle Chat / Voice Mode"
          >
            {config.mode === "voice" ? (
              <Mic className="w-3 h-3 text-violet-400" />
            ) : (
              <MessageSquare className="w-3 h-3 text-indigo-400" />
            )}
            <span className="capitalize">{config.mode} Bot</span>
          </button>
        </div>
      </div>

      {/* Center: Save Status & Undo/Redo */}
      <div className="flex items-center gap-2">
        {/* Autosave Status */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
          {saveStatus === "saving" ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>Saving...</span>
            </>
          ) : saveStatus === "unsaved" ? (
            <>
              <CloudOff className="w-3.5 h-3.5 text-slate-500" />
              <span>Unsaved changes</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saved</span>
            </>
          )}
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 hover:text-slate-200 transition"
            title="Undo (Cmd+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 hover:text-slate-200 transition"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Actions (Magic Box, Remix, Versions, Publish) */}
      <div className="flex items-center gap-2">
        {/* Magic Box */}
        <button
          onClick={onOpenMagicBox}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
          title="Generate bot prompt with AI"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Magic Box</span>
        </button>

        {/* Remix / Randomize */}
        <button
          onClick={onRemix}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
          title="Remix bot parameters"
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>

        {/* Version History Drawer Trigger */}
        <button
          onClick={onOpenVersions}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
          title="Version history"
        >
          <History className="w-3.5 h-3.5" />
        </button>

        {/* Publish */}
        <button
          onClick={onOpenPublish}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-glow transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Publish</span>
        </button>
      </div>
    </header>
  );
}
