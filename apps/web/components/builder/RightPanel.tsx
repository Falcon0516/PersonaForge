"use client";

import React, { useMemo } from "react";
import { MessageSquare, Terminal, Award, GitCompare } from "lucide-react";
import { BotConfig, Channel, scorePrompt } from "@personaforge/core";
import { RightTab } from "@/lib/builder/types";
import { PreviewTab } from "./PreviewTab";
import { PromptTab } from "./PromptTab";
import { ScoreTab } from "./ScoreTab";
import { ABConsoleTab } from "./ABConsoleTab";

interface RightPanelProps {
  config: BotConfig;
  channel: Channel;
  activeTab: RightTab;
  onChangeTab: (tab: RightTab) => void;
  onChangeChannel: (ch: Channel) => void;
  onAddBlock?: (blockId: string) => void;
}

export function RightPanel({
  config,
  channel,
  activeTab,
  onChangeTab,
  onChangeChannel,
  onAddBlock,
}: RightPanelProps) {
  const currentScore = useMemo(() => {
    try {
      return scorePrompt(config).score;
    } catch {
      return 0;
    }
  }, [config]);

  const scoreBadgeColor =
    currentScore >= 85
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      : currentScore >= 70
      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
      : "bg-rose-500/20 text-rose-300 border-rose-500/30";

  return (
    <div className="flex flex-col h-full bg-slate-950/70 border-l border-slate-800">
      {/* Tab Switcher Header */}
      <div className="flex items-center justify-between p-2.5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangeTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === "preview"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            Preview
          </button>

          <button
            onClick={() => onChangeTab("prompt")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === "prompt"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            Prompt
          </button>

          <button
            onClick={() => onChangeTab("score")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === "score"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Score
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${scoreBadgeColor}`}
            >
              {currentScore}
            </span>
          </button>

          <button
            onClick={() => onChangeTab("ab")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === "ab"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-violet-400" />
            A/B
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "preview" && (
          <PreviewTab
            config={config}
            channel={channel}
            onChangeChannel={onChangeChannel}
          />
        )}
        {activeTab === "prompt" && (
          <PromptTab config={config} channel={channel} />
        )}
        {activeTab === "score" && (
          <ScoreTab config={config} onAddBlock={onAddBlock} />
        )}
        {activeTab === "ab" && <ABConsoleTab configA={config} />}
      </div>
    </div>
  );
}
