import { z } from "zod";

export const UIThemeMode = z.enum(["light", "dark", "auto"]);
export type UIThemeMode = z.infer<typeof UIThemeMode>;

export const BubbleStyle = z.enum(["rounded", "pill", "sharp", "compact"]);
export type BubbleStyle = z.infer<typeof BubbleStyle>;

export const LauncherPosition = z.enum(["bottom-right", "bottom-left"]);
export type LauncherPosition = z.infer<typeof LauncherPosition>;

export const OrbStyle = z.enum(["fluid-glow", "minimal-pulse", "waveform-rings", "geometric"]);
export type OrbStyle = z.infer<typeof OrbStyle>;

export const UIConfig = z.object({
  theme: UIThemeMode.default("auto"),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default("#2563eb"),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default("#38bdf8"),
  surfaceColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default("#ffffff"),
  backgroundColor: z.string().default("#f8fafc"),
  backgroundType: z.enum(["solid", "gradient", "pattern"]).default("solid"),
  fontFamily: z.enum([
    "Inter",
    "Outfit",
    "Roboto",
    "Plus Jakarta Sans",
    "Fira Code",
    "System",
  ]).default("Inter"),
  bubbleStyle: BubbleStyle.default("rounded"),
  density: z.enum(["comfortable", "compact"]).default("comfortable"),
  avatarUrl: z.string().url().or(z.literal("")).default(""),
  avatarEmoji: z.string().default("🤖"),
  headerTitle: z.string().max(60).default("Assistant"),
  headerSubtitle: z.string().max(100).default("Online | Powered by PersonaForge"),
  greeting: z.string().max(300).default("Hello! How can I assist you today?"),
  suggestedChips: z.array(z.string().max(80)).max(6).default([]),
  showTimestamps: z.boolean().default(true),
  showFeedback: z.boolean().default(true),
  showCopyButton: z.boolean().default(true),
  showPoweredBy: z.boolean().default(true),
  launcherIcon: z.enum(["chat", "sparkles", "support", "bot"]).default("chat"),
  launcherPosition: LauncherPosition.default("bottom-right"),
  orbStyle: OrbStyle.default("fluid-glow"),
});

export type UIConfig = z.infer<typeof UIConfig>;
