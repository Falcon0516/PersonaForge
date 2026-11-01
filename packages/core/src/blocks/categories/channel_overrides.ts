import { z } from "zod";
import { BlockDef } from "../types.js";

export const channelOverrideBlocks: BlockDef<any>[] = [
  {
    id: "channel.whatsapp_length_cap",
    category: "channel_overrides",
    section: "output_format",
    label: "WhatsApp Character Limit",
    description: "Hard character cap tailored to WhatsApp screen readability (max 1500).",
    icon: "Smartphone",
    kind: "slider",
    min: 300,
    max: 1500,
    step: 50,
    schema: z.number().min(200).max(1500).default(1400),
    default: 1400,
    modes: ["chat"],
    channels: ["whatsapp"],
    priority: 95,
    render: (val, ctx) => {
      if (ctx.channel !== "whatsapp") return null;
      return `WHATSAPP LENGTH BUDGET: Keep the entire reply under ${val} characters so it delivers in a single clean message.`;
    },
  },
  {
    id: "channel.whatsapp_emoji_style",
    category: "channel_overrides",
    section: "personality_and_tone",
    label: "WhatsApp Visual Formatting",
    description: "Mobile formatting with friendly emoji bullets and *bolding*.",
    icon: "MessageSquare",
    kind: "select",
    schema: z.enum(["friendly_mobile", "minimal", "plain"]),
    default: "friendly_mobile",
    options: [
      { value: "friendly_mobile", label: "Mobile-Friendly Emoji Bullets (👉, 🌾, 💡)", hint: "Great for chat readability" },
      { value: "minimal", label: "Minimal (Occasional checkmark ✅)", hint: "Clean business style" },
      { value: "plain", label: "Plain Text Only", hint: "Zero emoji" },
    ],
    modes: ["chat"],
    channels: ["whatsapp"],
    priority: 90,
    render: (val, ctx) => {
      if (ctx.channel !== "whatsapp") return null;
      if (val === "friendly_mobile") {
        return "WHATSAPP FORMAT: Use short bullet lines prefixed with intuitive emojis (e.g. 🌾, 📦, 💡, 📞) and use *bold* asterisks for emphasis.";
      }
      return null;
    },
  },
  {
    id: "channel.voice_note_replies",
    category: "channel_overrides",
    section: "runtime_context",
    label: "Enable WhatsApp Voice Note Audio Replies",
    description: "Synthesize Sarvam TTS audio response when user sends a voice note on WhatsApp.",
    icon: "Volume2",
    kind: "toggle",
    schema: z.boolean().default(true),
    default: true,
    modes: ["chat", "voice"],
    channels: ["whatsapp"],
    priority: 88,
    render: () => null,
  },
  {
    id: "channel.image_understanding",
    category: "channel_overrides",
    section: "runtime_context",
    label: "Enable WhatsApp Image Understanding",
    description: "Analyze uploaded crops, receipts, or document photos using Groq Vision.",
    icon: "Camera",
    kind: "toggle",
    schema: z.boolean().default(true),
    default: true,
    modes: ["chat", "voice"],
    channels: ["whatsapp"],
    priority: 86,
    render: () => null,
  },
  {
    id: "channel.slash_command_help",
    category: "channel_overrides",
    section: "output_format",
    label: "WhatsApp Slash Command Guidance",
    description: "Notice explaining available commands (/use <code>, /reset, /lang, /help).",
    icon: "Terminal",
    kind: "text",
    schema: z.string().max(250),
    default: "Available commands: /use <code> to switch bots, /reset to clear history, /lang <code> to change language, /help for menu.",
    modes: ["chat"],
    channels: ["whatsapp"],
    priority: 84,
    render: (val, ctx) => {
      if (ctx.channel !== "whatsapp") return null;
      return (val && val.trim() ? `If the user asks for assistance navigating commands, mention: ${val.trim()}` : null);
    },
  },
  {
    id: "channel.per_channel_greeting",
    category: "channel_overrides",
    section: "behaviour",
    label: "Channel-Specific Greeting",
    description: "Custom opening line override tailored specifically for this channel.",
    icon: "Smile",
    kind: "text",
    schema: z.string().max(250),
    default: "",
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 82,
    render: (val) => (val && val.trim() ? `Channel greeting: ${val.trim()}` : null),
  },
];
