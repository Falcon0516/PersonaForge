import { z } from "zod";
import { BlockDef } from "../types.js";

export const conversationBlocks: BlockDef<any>[] = [
  {
    id: "memory.mode",
    category: "conversation_and_memory",
    section: "behaviour",
    label: "Memory Retention Mode",
    description: "How past turns in the conversation are tracked.",
    icon: "HardDrive",
    kind: "select",
    schema: z.enum(["none", "session", "summary"]),
    default: "session",
    options: [
      { value: "session", label: "Session Window", hint: "Retain last N conversation turns verbatim" },
      { value: "summary", label: "Rolling Summary", hint: "Compress older turns into an evolving summary" },
      { value: "none", label: "Stateless (None)", hint: "Zero history; treat each message in isolation" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 95,
    render: (val) => {
      if (val === "none") {
        return "CONVERSATION MEMORY: Stateless. Respond to the current turn independently without assuming prior context.";
      }
      if (val === "summary") {
        return "CONVERSATION MEMORY: Retain a continuous rolling synthesis of user goals and context across turns.";
      }
      return "CONVERSATION MEMORY: Maintain continuity across recent turns; reference user preferences and names shared earlier.";
    },
  },
  {
    id: "memory.window_size",
    category: "conversation_and_memory",
    section: "behaviour",
    label: "Memory Window Size (Turns)",
    description: "Number of prior dialogue messages retained in active context.",
    icon: "RotateCcw",
    kind: "slider",
    min: 2,
    max: 40,
    step: 2,
    schema: z.number().int().min(2).max(40),
    default: 10,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 90,
    render: () => null, // runtime context injected by backend runner
  },
  {
    id: "memory.summarisation",
    category: "conversation_and_memory",
    section: "behaviour",
    label: "Periodic Dialogue Summarization",
    description: "Compress extended dialogues periodically into contextual notes.",
    icon: "Minimize",
    kind: "toggle",
    schema: z.boolean(),
    default: false,
    modes: ["chat"],
    channels: ["web"],
    priority: 88,
    render: () => null,
  },
  {
    id: "memory.user_profile_fields",
    category: "conversation_and_memory",
    section: "behaviour",
    label: "Tracked User Profile Attributes",
    description: "Attributes to actively retain about the user across the discussion.",
    icon: "UserCheck",
    kind: "list",
    schema: z.array(z.string()).default(["name", "role", "location", "topic_of_interest"]),
    default: ["name", "role", "location", "topic_of_interest"],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 86,
    render: (val) => {
      if (!val || val.length === 0) return null;
      return `Track user attributes: actively remember the user's ${val.join(", ")} when revealed during dialogue.`;
    },
  },
  {
    id: "memory.session_timeout",
    category: "conversation_and_memory",
    section: "behaviour",
    label: "Inactivity Session Expiry",
    description: "Duration before conversation session context resets.",
    icon: "Clock",
    kind: "select",
    schema: z.enum(["fifteen_minutes", "one_hour", "twenty_four_hours", "seven_days"]),
    default: "twenty_four_hours",
    options: [
      { value: "fifteen_minutes", label: "15 Minutes", hint: "High security, resets rapidly" },
      { value: "one_hour", label: "1 Hour", hint: "Standard web support session" },
      { value: "twenty_four_hours", label: "24 Hours", hint: "WhatsApp 24-hr customer service window" },
      { value: "seven_days", label: "7 Days", hint: "Persistent multi-day relationship" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 84,
    render: () => null,
  },
  {
    id: "memory.returning_greeting",
    category: "conversation_and_memory",
    section: "behaviour",
    label: "Returning User Welcome Style",
    description: "How to greet a recognized user with prior chat history.",
    icon: "Smile",
    kind: "text",
    schema: z.string().max(200),
    default: "Welcome back! Acknowledge prior context warmly.",
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 82,
    render: (val) => (val && val.trim() ? `Returning user protocol: ${val.trim()}` : null),
  },
];
