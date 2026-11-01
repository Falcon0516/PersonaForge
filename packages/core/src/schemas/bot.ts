import { z } from "zod";
import { BotMode } from "./channels.js";
import { UIConfig } from "./ui.js";
import { VoiceConfig } from "./voice.js";

export const BotRuntimeConfig = z.object({
  model: z.string().default("llama-3.3-70b-versatile"),
  fallbackModels: z.array(z.string()).default(["llama-3.1-8b-instant"]),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().min(64).max(4096).default(800),
  memory: z.enum(["none", "session", "summary"]).default("session"),
  memoryWindow: z.number().int().min(2).max(40).default(10),
  cache: z.boolean().default(false),
  moderation: z.enum(["off", "standard", "strict"]).default("standard"),
});

export type BotRuntimeConfig = z.infer<typeof BotRuntimeConfig>;

export const BotChannelsConfig = z.object({
  web: z.object({
    enabled: z.boolean().default(true),
  }).default({ enabled: true }),
  whatsapp: z.object({
    enabled: z.boolean().default(false),
    replyCharCap: z.number().int().default(1500),
    voiceNoteReplies: z.boolean().default(true),
    imageUnderstanding: z.boolean().default(true),
  }).default({
    enabled: false,
    replyCharCap: 1500,
    voiceNoteReplies: true,
    imageUnderstanding: true,
  }),
});

export type BotChannelsConfig = z.infer<typeof BotChannelsConfig>;

export const BotConfig = z.object({
  schemaVersion: z.literal(1).default(1),
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]{3,40}$/),
  name: z.string().min(1).max(60),
  mode: BotMode.default("chat"),
  industry: z.string().default("general"),
  blocks: z.record(z.string(), z.unknown()).default({}),
  blockOrder: z.array(z.string()).optional(),
  expert: z
    .object({
      append: z.string().max(4000).optional(),
      replace: z.string().max(12000).nullable().optional(),
    })
    .optional()
    .default({}),
  runtime: BotRuntimeConfig.default({
    model: "llama-3.3-70b-versatile",
    fallbackModels: ["llama-3.1-8b-instant"],
    temperature: 0.7,
    maxTokens: 800,
    memory: "session",
    memoryWindow: 10,
    cache: false,
    moderation: "standard",
  }),
  ui: UIConfig.default({}),
  voice: VoiceConfig.optional(),
  channels: BotChannelsConfig.default({}),
});

export type BotConfig = z.infer<typeof BotConfig>;

// PublicBot: client-safe subset. NEVER includes the compiled prompt or server credentials.
export const PublicBot = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  mode: BotMode,
  industry: z.string(),
  ui: UIConfig,
  voice: VoiceConfig.optional(),
  channels: z.object({
    web: z.object({ enabled: z.boolean() }),
    whatsapp: z.object({ enabled: z.boolean() }),
  }),
  publicToken: z.string().optional(),
});

export type PublicBot = z.infer<typeof PublicBot>;

// ExportManifest: for standalone HTML export in hosted and BYOK modes
export const ExportManifest = z.object({
  formatVersion: z.literal(1).default(1),
  mode: z.enum(["hosted", "byok"]),
  botId: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  exportedAt: z.string(),
  ui: UIConfig,
  voice: VoiceConfig.optional(),
  apiBase: z.string().url().optional(),
  publicToken: z.string().optional(),
  compiledPrompt: z.string().optional(), // ONLY present in byok mode, strictly forbidden in hosted mode
  runtime: z.object({
    model: z.string(),
    temperature: z.number(),
    maxTokens: z.number(),
  }),
});

export type ExportManifest = z.infer<typeof ExportManifest>;
