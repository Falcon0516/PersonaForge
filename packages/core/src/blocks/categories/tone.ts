import { z } from "zod";
import { BlockDef } from "../types.js";

export const toneBlocks: BlockDef<any>[] = [
  {
    id: "tone.preset",
    category: "tone_and_style",
    section: "personality_and_tone",
    label: "Tone Preset",
    description: "Overall voice and cadence style profile.",
    icon: "Volume2",
    kind: "select",
    schema: z.enum([
      "executive",
      "friendly",
      "academic",
      "energetic",
      "empathetic",
      "concise",
      "gen_z",
    ]),
    default: "friendly",
    options: [
      { value: "friendly", label: "Friendly & Approachable", hint: "Warm, helpful, standard conversational style" },
      { value: "executive", label: "Executive & Polished", hint: "Boardroom-ready, crisp, high-impact phrasing" },
      { value: "academic", label: "Academic & Thorough", hint: "Precise terminology, analytical rigor" },
      { value: "energetic", label: "Energetic & Motivating", hint: "Upbeat coach, proactive enthusiasm" },
      { value: "empathetic", label: "Empathetic & Gentle", hint: "Supportive, thoughtful, compassionate" },
      { value: "concise", label: "Ultra Concise & Telegraphic", hint: "Bullet points, minimal words" },
      { value: "gen_z", label: "Gen-Z & Trendy", hint: "Modern internet slang, breezy vibes" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 92,
    render: (val) => {
      switch (val) {
        case "executive":
          return "Tone preset: Executive. Speak with boardroom precision, strategic perspective, and concise polish.";
        case "academic":
          return "Tone preset: Academic. Employ intellectual rigor, precise definitions, and structured analysis.";
        case "energetic":
          return "Tone preset: Energetic. Project vibrant motivation and high-energy encouragement.";
        case "empathetic":
          return "Tone preset: Empathetic. Speak with gentle understanding, patience, and attentive care.";
        case "concise":
          return "Tone preset: Telegraphic. Deliver minimal words, zero fluff, and direct bottom lines.";
        case "gen_z":
          return "Tone preset: Gen-Z. Use relaxed internet phrasing, contemporary vibes, and casual lowercase ease.";
        case "friendly":
        default:
          return "Tone preset: Friendly. Warm, approachable, helpful, and easily understood.";
      }
    },
    conflicts: [
      {
        with: "personality.formality",
        when: (preset, formality) => preset === "gen_z" && (formality as number) >= 0.7,
        message: "Gen-Z tone preset conflicts with high formality.",
        fix: { blockId: "personality.formality", value: 0.2, action: "set" },
      },
    ],
  },
  {
    id: "tone.vocabulary_level",
    category: "tone_and_style",
    section: "personality_and_tone",
    label: "Vocabulary Level",
    description: "Complexity of vocabulary used.",
    icon: "Book",
    kind: "select",
    schema: z.enum(["elementary", "accessible", "advanced", "domain_specialist"]),
    default: "accessible",
    options: [
      { value: "elementary", label: "Simple & Plain (5th Grade)", hint: "Plain language, simple common words" },
      { value: "accessible", label: "Accessible (High School)", hint: "Clear everyday professional English" },
      { value: "advanced", label: "Advanced (College / Professional)", hint: "Sophisticated vocabulary and nuances" },
      { value: "domain_specialist", label: "Specialist", hint: "Accurate field-specific technical terminology" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 84,
    render: (val) => {
      if (val === "elementary") return "Vocabulary: Simple and plain. Use short, common everyday words; avoid complex phrasing.";
      if (val === "domain_specialist") return "Vocabulary: Use rigorous field-specific nomenclature and technical terminology.";
      if (val === "advanced") return "Vocabulary: Elevated and articulate professional vocabulary.";
      return null;
    },
  },
  {
    id: "tone.sentence_length",
    category: "tone_and_style",
    section: "personality_and_tone",
    label: "Sentence Length",
    description: "Preferred sentence rhythm.",
    icon: "AlignLeft",
    kind: "select",
    schema: z.enum(["short_crisp", "balanced", "elaborate"]),
    default: "balanced",
    options: [
      { value: "short_crisp", label: "Short & Crisp", hint: "Under 15 words per sentence; easy to scan" },
      { value: "balanced", label: "Balanced", hint: "Natural rhythm with varied sentence lengths" },
      { value: "elaborate", label: "Elaborate & Flowing", hint: "Detailed compound sentences" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 82,
    render: (val) => {
      if (val === "short_crisp") return "Structure sentences short, punchy, and crisp. Avoid multi-clause sentences.";
      if (val === "elaborate") return "Write rich, flowing, well-articulated paragraphs.";
      return null;
    },
  },
  {
    id: "tone.jargon_level",
    category: "tone_and_style",
    section: "personality_and_tone",
    label: "Industry Jargon",
    description: "Handling technical acronyms and industry terms.",
    icon: "Cpu",
    kind: "select",
    schema: z.enum(["forbidden", "explain_first", "assume_knowledge"]),
    default: "explain_first",
    options: [
      { value: "forbidden", label: "Strictly Avoid Jargon", hint: "Replace all acronyms with simple words" },
      { value: "explain_first", label: "Define Jargon on First Use", hint: "Use acronyms but immediately clarify" },
      { value: "assume_knowledge", label: "Assume Knowledge", hint: "Freely use domain terms without explanations" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 80,
    render: (val) => {
      if (val === "forbidden") return "Do not use technical jargon or acronyms; translate concepts into plain language.";
      if (val === "explain_first") return "When using industry terms or acronyms, define them simply upon first mention.";
      if (val === "assume_knowledge") return "Use standard domain terms and acronyms freely without unnecessary hand-holding.";
      return null;
    },
  },
  {
    id: "tone.slang",
    category: "tone_and_style",
    section: "personality_and_tone",
    label: "Internet & Slang Usage",
    description: "Use modern internet vernacular where appropriate.",
    icon: "Hash",
    kind: "toggle",
    schema: z.boolean(),
    default: false,
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 76,
    render: (val) =>
      val
        ? "Tasteful modern internet slang (e.g., 'no cap', 'vibe check', 'bet', 'lowkey') may be used in casual context."
        : null,
  },
  {
    id: "tone.honorifics",
    category: "tone_and_style",
    section: "personality_and_tone",
    label: "Honorifics & Cultural Respect",
    description: "Respectful address styles across cultures (e.g. KisanMitra 'anna'/'bhai').",
    icon: "Heart",
    kind: "select",
    schema: z.enum(["none", "formal_western", "indian_kinship", "east_asian_san"]),
    default: "none",
    options: [
      { value: "none", label: "Standard / Direct", hint: "No added honorific titles" },
      { value: "formal_western", label: "Sir / Madam / Mr. / Ms.", hint: "Classic formal Western honorifics" },
      { value: "indian_kinship", label: "Indian Kinship (Anna, Bhai, Ji)", hint: "Warm regional kinship respect" },
      { value: "east_asian_san", label: "Polite Name Suffix (-san)", hint: "Japanese respectful address" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 74,
    render: (val) => {
      if (val === "indian_kinship")
        return "Address users with warm regional honorifics: use 'anna' in Kannada, 'bhai' or 'ji' in Hindi, or 'friend'.";
      if (val === "formal_western")
        return "Address users formally with polite honorifics such as 'Sir', 'Madam', or 'Mr./Ms.' as appropriate.";
      if (val === "east_asian_san")
        return "Attach respectful polite suffixes (e.g., -san) when addressing individuals by name.";
      return null;
    },
  },
  {
    id: "tone.emoji_usage",
    category: "tone_and_style",
    section: "personality_and_tone",
    label: "Emoji Usage",
    description: "Frequency and style of emoji in responses.",
    icon: "Smile",
    kind: "select",
    schema: z.enum(["none", "minimal", "expressive", "frequent"]),
    default: "minimal",
    options: [
      { value: "none", label: "Zero Emoji", hint: "Completely text-only, no emoji" },
      { value: "minimal", label: "Minimal (1 per message)", hint: "Occasional polite touch" },
      { value: "expressive", label: "Expressive (2-3 per message)", hint: "Friendly, visual, modern" },
      { value: "frequent", label: "Frequent & Fun", hint: "Lots of expressive emoji throughout" },
    ],
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 70,
    render: (val, ctx) => {
      if (ctx.channel === "voice") return null; // never emit emojis in spoken voice
      if (val === "none") return "Do not include any emojis in your responses.";
      if (val === "minimal") return "Use at most one tasteful emoji per reply where natural.";
      if (val === "expressive") return "Include friendly, relevant emojis (2-3) to keep messages visually inviting.";
      if (val === "frequent") return "Use expressive emojis generously throughout your messages.";
      return null;
    },
  },
  {
    id: "tone.storytelling",
    category: "tone_and_style",
    section: "personality_and_tone",
    label: "Narrative & Storytelling",
    description: "Frame explanations through narrative vignettes and real-world scenarios.",
    icon: "Feather",
    kind: "toggle",
    schema: z.boolean(),
    default: false,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 66,
    render: (val) =>
      val ? "Where appropriate, illustrate advice through short relatable narrative scenarios and case studies." : null,
  },
  {
    id: "tone.metaphors",
    category: "tone_and_style",
    section: "personality_and_tone",
    label: "Analogy & Metaphor",
    description: "Use everyday analogies to clarify abstract or complex topics.",
    icon: "GitBranch",
    kind: "toggle",
    schema: z.boolean(),
    default: true,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 64,
    render: (val) =>
      val ? "Explain difficult concepts using intuitive, everyday analogies and metaphors." : null,
  },
  {
    id: "tone.cultural_flavor",
    category: "tone_and_style",
    section: "personality_and_tone",
    label: "Cultural Flavour & Local Nuance",
    description: "Regional cultural warmth, expressions, or local context.",
    icon: "Globe",
    kind: "text",
    schema: z.string().max(200),
    default: "",
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 60,
    render: (val) => (val && val.trim() ? `Cultural nuance:\n${val.trim()}` : null),
  },
];
