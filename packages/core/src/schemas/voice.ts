import { z } from "zod";

export const VOICE_CAPABILITIES = {
  stt: {
    models: ["saarika:v2.5"],
    defaultModel: "saarika:v2.5",
    languages: ["en-IN", "hi-IN", "kn-IN", "ta-IN", "te-IN", "bn-IN", "mr-IN", "gu-IN", "ml-IN", "pa-IN", "od-IN"],
  },
  tts: {
    models: ["bulbul:v3"],
    defaultModel: "bulbul:v3",
    speakersByModel: {
      "bulbul:v3": ["shruti", "aditya", "meera", "aravind", "ananya", "rohan"],
    } as Record<string, string[]>,
    defaultSpeaker: "shruti",
    paceRange: { min: 0.5, max: 2.0, default: 1.0 },
    supportedLanguages: [
      { code: "en-IN", label: "English (India)" },
      { code: "hi-IN", label: "Hindi" },
      { code: "kn-IN", label: "Kannada" },
      { code: "ta-IN", label: "Tamil" },
      { code: "te-IN", label: "Telugu" },
      { code: "bn-IN", label: "Bengali" },
      { code: "mr-IN", label: "Marathi" },
      { code: "gu-IN", label: "Gujarati" },
      { code: "ml-IN", label: "Malayalam" },
    ],
  },
} as const;

export const VoiceConfig = z.object({
  speaker: z.string().default(VOICE_CAPABILITIES.tts.defaultSpeaker),
  pace: z.number().min(0.5).max(2.0).default(1.0),
  language: z.string().default("en-IN"),
  handsFree: z.boolean().default(false),
  bargeIn: z.boolean().default(true),
  captions: z.boolean().default(true),
  silenceTimeoutMs: z.number().int().min(500).max(10000).default(1800),
  vadSensitivity: z.enum(["low", "medium", "high"]).default("medium"),
  spokenStyleRules: z.boolean().default(true),
});

export type VoiceConfig = z.infer<typeof VoiceConfig>;
