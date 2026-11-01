import { z } from "zod";
import { BlockDef } from "../types.js";

export const languageBlocks: BlockDef<any>[] = [
  {
    id: "language.primary",
    category: "language",
    section: "language",
    label: "Primary Language",
    description: "Default language for greetings and responses.",
    icon: "Globe",
    kind: "select",
    schema: z.enum(["en", "hi", "kn", "ta", "te", "bn", "mr", "es", "fr", "de"]),
    default: "en",
    options: [
      { value: "en", label: "English", hint: "Global English" },
      { value: "hi", label: "Hindi (हिंदी)", hint: "Devanagari script" },
      { value: "kn", label: "Kannada (ಕನ್ನಡ)", hint: "Kannada script" },
      { value: "ta", label: "Tamil (தமிழ்)", hint: "Tamil script" },
      { value: "te", label: "Telugu (తెలుగు)", hint: "Telugu script" },
      { value: "bn", label: "Bengali (বাংলা)", hint: "Bengali script" },
      { value: "mr", label: "Marathi (मराठी)", hint: "Marathi script" },
      { value: "es", label: "Spanish (Español)", hint: "Spanish" },
      { value: "fr", label: "French (Français)", hint: "French" },
      { value: "de", label: "German (Deutsch)", hint: "German" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 95,
    render: (val) => {
      const names: Record<string, string> = {
        en: "English",
        hi: "Hindi",
        kn: "Kannada",
        ta: "Tamil",
        te: "Telugu",
        bn: "Bengali",
        mr: "Marathi",
        es: "Spanish",
        fr: "French",
        de: "German",
      };
      return `Primary language: ${names[val] || val}. Default to this language unless the user addresses you in an allowed alternative.`;
    },
  },
  {
    id: "language.allowed",
    category: "language",
    section: "language",
    label: "Allowed Languages",
    description: "Languages the bot is authorized to understand and reply in.",
    icon: "Languages",
    kind: "multiselect",
    schema: z.array(z.string()).min(1).default(["en"]),
    default: ["en", "hi", "kn"],
    options: [
      { value: "en", label: "English" },
      { value: "hi", label: "Hindi" },
      { value: "kn", label: "Kannada" },
      { value: "ta", label: "Tamil" },
      { value: "te", label: "Telugu" },
      { value: "bn", label: "Bengali" },
      { value: "mr", label: "Marathi" },
      { value: "es", label: "Spanish" },
      { value: "fr", label: "French" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 90,
    render: (val) => {
      if (!val || val.length === 0) return null;
      return `Authorized languages: ${val.join(", ")}. If user speaks any of these languages, respond accordingly. If addressed in another language, politely explain in English or primary language that you can only assist in: ${val.join(", ")}.`;
    },
  },
  {
    id: "language.mirror_user",
    category: "language",
    section: "language",
    label: "Mirror User Language",
    description: "Automatically detect and match the language the user speaks.",
    icon: "RefreshCw",
    kind: "toggle",
    schema: z.boolean(),
    default: true,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 88,
    render: (val) =>
      val
        ? "Language mirroring: Dynamically mirror the language used by the user in their latest message (within authorized languages)."
        : null,
  },
  {
    id: "language.code_mixing",
    category: "language",
    section: "language",
    label: "Code-Mixing (Hinglish/Colloquial)",
    description: "Allowing natural bilingual mixing or requiring strict pure vocabulary.",
    icon: "Shuffle",
    kind: "select",
    schema: z.enum(["strict_pure", "natural_colloquial", "english_loanwords_allowed"]),
    default: "english_loanwords_allowed",
    options: [
      { value: "strict_pure", label: "Strict Pure Language", hint: "No language mixing; pure classical vocabulary" },
      { value: "english_loanwords_allowed", label: "Allow Common English Loanwords", hint: "e.g. 'train', 'booking', 'price'" },
      { value: "natural_colloquial", label: "Natural Conversational Code-Mixing", hint: "Hinglish/Kanglish friendly" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 84,
    render: (val) => {
      if (val === "strict_pure")
        return "Vocabulary purity: Do not mix languages or borrow words from English when speaking Indic languages.";
      if (val === "natural_colloquial")
        return "Code-mixing: Conversational code-mixing (e.g. natural Hinglish or Kanglish) is permitted when the user initiates it.";
      return "Permit universally recognized English loanwords (e.g., ticket, mobile, market, balance) for natural clarity.";
    },
  },
  {
    id: "language.script_preference",
    category: "language",
    section: "language",
    label: "Script Preference",
    description: "Native Indic script vs Latin transliteration (Romanized).",
    icon: "Type",
    kind: "select",
    schema: z.enum(["native_script_only", "match_user_script", "romanized_latin"]),
    default: "match_user_script",
    options: [
      { value: "match_user_script", label: "Match User Script", hint: "If user types Roman Hindi, reply Roman Hindi" },
      { value: "native_script_only", label: "Always Native Script", hint: "Devanagari for Hindi, Kannada script for Kannada" },
      { value: "romanized_latin", label: "Romanized Latin Script", hint: "Transliterated into Latin alphabet" },
    ],
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 82,
    render: (val) => {
      if (val === "native_script_only")
        return "Script preference: Always reply using the official native script (e.g., Devanagari for Hindi, Kannada script for Kannada).";
      if (val === "romanized_latin")
        return "Script preference: Output Indic languages transliterated into Latin/Roman alphabet.";
      return "Script preference: Mirror the user's script choice (if they write in Roman transliteration, reply in Roman transliteration).";
    },
  },
  {
    id: "language.translate_on_request",
    category: "language",
    section: "language",
    label: "Translate on User Request",
    description: "Allow the assistant to translate prior replies if the user asks.",
    icon: "FileText",
    kind: "toggle",
    schema: z.boolean(),
    default: true,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 80,
    render: (val) =>
      val ? "If the user asks to repeat or translate an answer into another language, accommodate immediately." : null,
  },
  {
    id: "language.per_language_formality",
    category: "language",
    section: "language",
    label: "Per-Language Formality Nuance",
    description: "Custom pronoun distinctions (e.g. Aap vs Tum in Hindi).",
    icon: "Sliders",
    kind: "text",
    schema: z.string().max(250),
    default: "In Hindi use respectful 'आप' (Aap); in Kannada use respectful 'ನೀವು' (Neevu).",
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 78,
    render: (val) => (val && val.trim() ? `Language Formality Rules:\n${val.trim()}` : null),
  },
  {
    id: "language.number_currency_format",
    category: "language",
    section: "language",
    label: "Number & Currency Notation",
    description: "Currency symbol and number grouping conventions.",
    icon: "DollarSign",
    kind: "select",
    schema: z.enum(["inr_lakh_crore", "usd_millions", "euro_decimal", "local_symbol"]),
    default: "inr_lakh_crore",
    options: [
      { value: "inr_lakh_crore", label: "Indian Format (₹ Lakh / Crore)", hint: "₹, 1,00,000 / 1 Lakh" },
      { value: "usd_millions", label: "Western Format ($ Millions / Billions)", hint: "$, 1,000,000 / 1 Million" },
      { value: "euro_decimal", label: "European (€ Dot notation)", hint: "€ 1.000,00" },
      { value: "local_symbol", label: "Contextual Local Currency", hint: "Detect from user country" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 76,
    render: (val) => {
      if (val === "inr_lakh_crore")
        return "Notation: Format Indian Rupees with ₹ symbol and Indian numbering system (e.g., ₹1,50,000 / 1.5 Lakhs).";
      if (val === "usd_millions")
        return "Notation: Format figures in US Dollars ($) with thousands/millions groupings (e.g., $150,000).";
      return null;
    },
  },
];
