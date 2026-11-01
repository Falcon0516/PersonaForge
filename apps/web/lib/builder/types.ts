import { BotConfig, Channel, Conflict, ScoreResult } from "@personaforge/core";

export type RightTab = "preview" | "prompt" | "score" | "ab";

export interface VersionSnapshot {
  id: string;
  timestamp: string;
  name: string;
  config: BotConfig;
  score: number;
}

export interface BuilderState {
  config: BotConfig;
  activeChannel: Channel;
  activeTab: RightTab;
  searchQuery: string;
  selectedCategory: string;
  saveStatus: "saved" | "saving" | "unsaved";
  history: BotConfig[];
  historyIndex: number;
  versions: VersionSnapshot[];
  conflicts: Conflict[];
  qualityReport: ScoreResult | null;
  selectedBlockId: string | null;
}
