export const PROMPT_SECTIONS = [
  "identity",
  "business_context",
  "personality_and_tone",
  "language",
  "knowledge_rules",
  "behaviour",
  "output_format",
  "guardrails",
  "actions",
  "examples",
  "runtime_context",
] as const;

export type PromptSectionId = (typeof PROMPT_SECTIONS)[number];

export const CATEGORIES = [
  "identity",
  "personality",
  "tone_and_style",
  "industry_and_domain",
  "business_context",
  "knowledge",
  "behaviour",
  "language",
  "output_format",
  "rules_and_guardrails",
  "actions_and_integrations",
  "conversation_and_memory",
  "voice",
  "model_and_runtime",
  "channel_overrides",
] as const;

export type CategoryId = (typeof CATEGORIES)[number];

export interface CompileContext {
  channel: "web" | "voice" | "whatsapp";
  mode: "chat" | "voice";
  botName: string;
  industry: string;
  runtime?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface Patch {
  blockId: string;
  value: unknown;
  action: "set" | "remove";
}

export interface Conflict {
  id: string;
  blockA: string;
  blockB: string;
  message: string;
  fix?: Patch | undefined;
}

export interface Check {
  id: string;
  title: string;
  description: string;
  passed: boolean;
  scoreDelta: number;
  actionHint?: string | undefined;
}

export interface ScoreResult {
  score: number; // 0 to 100
  checks: Check[];
}
