import { z } from "zod";
import { BlockDef } from "../types.js";

export const personalityBlocks: BlockDef<any>[] = [
  {
    id: "personality.warmth",
    category: "personality",
    section: "personality_and_tone",
    label: "Warmth",
    description: "Cold and robotic (0) to deeply caring and affectionate (1).",
    icon: "Heart",
    kind: "slider",
    min: 0,
    max: 1,
    step: 0.1,
    schema: z.number().min(0).max(1),
    default: 0.8,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 95,
    render: (val) => {
      if (val >= 0.8) return "Exhibit high emotional warmth, kindness, and welcoming hospitality.";
      if (val <= 0.2) return "Maintain an emotionally neutral, matter-of-fact, detached demeanor.";
      return "Maintain a balanced, pleasantly warm and respectful demeanor.";
    },
  },
  {
    id: "personality.humour",
    category: "personality",
    section: "personality_and_tone",
    label: "Humour Level",
    description: "Strictly serious (0) to playfully witty (1).",
    icon: "Smile",
    kind: "slider",
    min: 0,
    max: 1,
    step: 0.1,
    schema: z.number().min(0).max(1),
    default: 0.3,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 90,
    render: (val) => {
      if (val >= 0.7) return "Use playful wit, tasteful humor, and lighthearted analogies where appropriate.";
      if (val <= 0.1) return "Keep all responses completely serious and professional; avoid jokes or puns.";
      return "Subtle dry wit may be used sparingly when the user invites it.";
    },
  },
  {
    id: "personality.empathy",
    category: "personality",
    section: "personality_and_tone",
    label: "Empathy & Validation",
    description: "Acknowledge user frustrations and emotions.",
    icon: "HeartHandshake",
    kind: "slider",
    min: 0,
    max: 1,
    step: 0.1,
    schema: z.number().min(0).max(1),
    default: 0.8,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 88,
    render: (val) => {
      if (val >= 0.7) return "Actively validate user emotions and distress before jumping into solutions.";
      if (val <= 0.2) return "Focus directly on operational facts without emotional commentary.";
      return "Acknowledge concerns succinctly, then transition smoothly into practical help.";
    },
  },
  {
    id: "personality.confidence",
    category: "personality",
    section: "personality_and_tone",
    label: "Confidence",
    description: "Modest and deferential (0) to decisive and authoritative (1).",
    icon: "ShieldCheck",
    kind: "slider",
    min: 0,
    max: 1,
    step: 0.1,
    schema: z.number().min(0).max(1),
    default: 0.8,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 85,
    render: (val) => {
      if (val >= 0.8) return "Speak with authoritative confidence, decisive clarity, and minimal hedging.";
      if (val <= 0.3) return "Express humble deference, offer suggestions as possibilities rather than absolutes.";
      return "Speak with measured, grounded confidence.";
    },
  },
  {
    id: "personality.curiosity",
    category: "personality",
    section: "personality_and_tone",
    label: "Curiosity",
    description: "How actively the bot asks thoughtful follow-up questions.",
    icon: "HelpCircle",
    kind: "slider",
    min: 0,
    max: 1,
    step: 0.1,
    schema: z.number().min(0).max(1),
    default: 0.5,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 80,
    render: (val) => {
      if (val >= 0.7) return "Demonstrate genuine intellectual curiosity; ask thoughtful clarifying questions.";
      if (val <= 0.2) return "Answer only what is asked without unprompted investigative questions.";
      return null;
    },
  },
  {
    id: "personality.patience",
    category: "personality",
    section: "personality_and_tone",
    label: "Patience Level",
    description: "Handling confusion, repetitive queries, or novices.",
    icon: "Clock",
    kind: "slider",
    min: 0,
    max: 1,
    step: 0.1,
    schema: z.number().min(0).max(1),
    default: 0.9,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 78,
    render: (val) => {
      if (val >= 0.7) return "Exercise exceptional patience: break down complex steps gently without condescension.";
      return null;
    },
  },
  {
    id: "personality.formality",
    category: "personality",
    section: "personality_and_tone",
    label: "Formality",
    description: "Casual and slangy (0) to strictly ceremonious and formal (1).",
    icon: "Award",
    kind: "slider",
    min: 0,
    max: 1,
    step: 0.1,
    schema: z.number().min(0).max(1),
    default: 0.6,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 75,
    render: (val) => {
      if (val >= 0.8) return "Maintain high business formality: structured phrasing, proper grammar, no casualisms.";
      if (val <= 0.2) return "Keep tone very casual, breezy, and conversational; contractions and relaxed phrasing encouraged.";
      return "Maintain professional yet accessible semi-formal communication.";
    },
    conflicts: [
      {
        with: "tone.slang",
        when: (formality, slangVal) => (formality as number) >= 0.7 && Boolean(slangVal),
        message: "High formality conflicts with modern slang.",
        fix: { blockId: "tone.slang", value: false, action: "set" },
      },
    ],
  },
  {
    id: "personality.enthusiasm",
    category: "personality",
    section: "personality_and_tone",
    label: "Enthusiasm",
    description: "Understated and chill (0) to energizing and exclamation-filled (1).",
    icon: "Zap",
    kind: "slider",
    min: 0,
    max: 1,
    step: 0.1,
    schema: z.number().min(0).max(1),
    default: 0.6,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 72,
    render: (val) => {
      if (val >= 0.8) return "Radiate upbeat enthusiasm, encouragement, and vibrant energy!";
      if (val <= 0.2) return "Maintain an understated, calm, low-energy cadence without exclamation points.";
      return null;
    },
  },
  {
    id: "personality.directness",
    category: "personality",
    section: "personality_and_tone",
    label: "Directness",
    description: "Gentle and diplomatic (0) to blunt and bottom-line-first (1).",
    icon: "Target",
    kind: "slider",
    min: 0,
    max: 1,
    step: 0.1,
    schema: z.number().min(0).max(1),
    default: 0.7,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 70,
    render: (val) => {
      if (val >= 0.8) return "Be extremely direct: lead with the core answer or conclusion before explanations.";
      if (val <= 0.3) return "Use gentle, diplomatic diplomacy; cushion tough feedback softly.";
      return null;
    },
  },
  {
    id: "personality.creativity",
    category: "personality",
    section: "personality_and_tone",
    label: "Creativity",
    description: "Strictly literal facts (0) to imaginative metaphors and storytelling (1).",
    icon: "PenTool",
    kind: "slider",
    min: 0,
    max: 1,
    step: 0.1,
    schema: z.number().min(0).max(1),
    default: 0.4,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 65,
    render: (val) => {
      if (val >= 0.7) return "Use creative metaphors, vivid analogies, and storytelling to illuminate ideas.";
      if (val <= 0.2) return "Stick strictly to concrete facts and literal specifications without poetic flourish.";
      return null;
    },
  },
  {
    id: "personality.sarcasm",
    category: "personality",
    section: "personality_and_tone",
    label: "Sarcasm & Banter",
    description: "Allows ironic wit and cheeky sarcasm for entertainment/character bots.",
    icon: "Flame",
    kind: "toggle",
    schema: z.boolean(),
    default: false,
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 60,
    render: (val) => (val ? "Light snark, dry sarcasm, and playful teasing are allowed in good fun." : null),
    conflicts: [
      {
        with: "personality.empathy",
        when: (sarcasm, emp) => Boolean(sarcasm) && (emp as number) >= 0.8,
        message: "High empathy conflicts with sarcastic persona.",
        fix: { blockId: "personality.sarcasm", value: false, action: "set" },
      },
    ],
  },
  {
    id: "personality.assertiveness",
    category: "personality",
    section: "personality_and_tone",
    label: "Assertiveness",
    description: "Firmly guides the conversation towards productive objectives.",
    icon: "CheckSquare",
    kind: "slider",
    min: 0,
    max: 1,
    step: 0.1,
    schema: z.number().min(0).max(1),
    default: 0.6,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 55,
    render: (val) => {
      if (val >= 0.8) return "Firmly steer users toward resolution when conversations drift or loop.";
      return null;
    },
  },
];
