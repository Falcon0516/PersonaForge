import { z } from "zod";
import { BlockDef } from "../types.js";

export const outputBlocks: BlockDef<any>[] = [
  {
    id: "output.markdown",
    category: "output_format",
    section: "output_format",
    label: "Markdown Formatting",
    description: "Use rich markdown formatting (bold, italics, lists, quotes).",
    icon: "FileCode",
    kind: "toggle",
    schema: z.boolean(),
    default: true,
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 95,
    render: (val, ctx) => {
      if (ctx.channel === "voice") {
        return "VOICE RESTRICTION: Do not use any markdown formatting, asterisks, hash tags, or code markers. Output purely spoken text.";
      }
      if (!val) {
        return "Plain text only: Do not use markdown syntax (no asterisks, backticks, or headings).";
      }
      return "Use clean markdown formatting (bolding key terms, clean lists) to make responses easy to read.";
    },
    conflicts: [
      {
        with: "voice.spoken_style",
        when: (mdVal, spokenVal) => Boolean(mdVal) && Boolean(spokenVal),
        message: "Rich markdown formatting conflicts with voice spoken-style rules.",
        fix: { blockId: "output.markdown", value: false, action: "set" },
      },
    ],
  },
  {
    id: "output.bullets",
    category: "output_format",
    section: "output_format",
    label: "Bullet Lists for Enumeration",
    description: "Format multiple items or options as structured bullet points.",
    icon: "List",
    kind: "toggle",
    schema: z.boolean(),
    default: true,
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 90,
    render: (val, ctx) => {
      if (ctx.channel === "voice") return null;
      return val ? "Present 2 or more related points as clear, concise bullet points rather than a wall of text." : null;
    },
  },
  {
    id: "output.tables",
    category: "output_format",
    section: "output_format",
    label: "Markdown Tables",
    description: "Present multi-column comparative data as markdown tables.",
    icon: "Grid",
    kind: "toggle",
    schema: z.boolean(),
    default: true,
    modes: ["chat"],
    channels: ["web"],
    priority: 88,
    render: (val, ctx) => {
      if (ctx.channel === "whatsapp") {
        return "WHATSAPP RESTRICTION: Do not generate markdown tables (tables render poorly on WhatsApp). Use key: value bullet lines instead.";
      }
      if (ctx.channel === "voice") return null;
      return val ? "Use markdown tables when presenting comparative or tabular data." : null;
    },
  },
  {
    id: "output.headings",
    category: "output_format",
    section: "output_format",
    label: "Markdown Headings",
    description: "Organize long answers with ## and ### headings.",
    icon: "Type",
    kind: "toggle",
    schema: z.boolean(),
    default: true,
    modes: ["chat"],
    channels: ["web"],
    priority: 86,
    render: (val, ctx) => {
      if (ctx.channel === "whatsapp") {
        return "WHATSAPP RESTRICTION: Do not use '#' markdown headings. Use *BOLD TEXT* for section breaks.";
      }
      if (ctx.channel === "voice") return null;
      return val ? "Use ## and ### section headings to structure complex multi-part responses." : null;
    },
  },
  {
    id: "output.code_blocks",
    category: "output_format",
    section: "output_format",
    label: "Syntax Highlighted Code",
    description: "Format code snippets in fenced code blocks with language identifiers.",
    icon: "Terminal",
    kind: "toggle",
    schema: z.boolean(),
    default: true,
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 84,
    render: (val, ctx) => {
      if (ctx.channel === "voice") return null;
      return val ? "Format code snippets in markdown code fences (```lang) with explicit language tags." : null;
    },
  },
  {
    id: "output.max_characters",
    category: "output_format",
    section: "output_format",
    label: "Character Cap",
    description: "Strict character budget ceiling for replies.",
    icon: "ShieldAlert",
    kind: "slider",
    min: 200,
    max: 2000,
    step: 50,
    schema: z.number().min(100).max(4000),
    default: 1200,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 82,
    render: (val, ctx) => {
      const cap = ctx.channel === "whatsapp" ? Math.min(val, 1500) : val;
      return `STRICT LENGTH LIMIT: Your total response MUST stay strictly under ${cap} characters.`;
    },
  },
  {
    id: "output.json_mode",
    category: "output_format",
    section: "output_format",
    label: "JSON Output Support",
    description: "Emit structured JSON when specifically requested by the user.",
    icon: "Code",
    kind: "toggle",
    schema: z.boolean(),
    default: false,
    modes: ["chat"],
    channels: ["web"],
    priority: 80,
    render: (val) =>
      val ? "If the user explicitly asks for JSON, output valid, parsable JSON without extraneous markdown chat." : null,
  },
  {
    id: "output.link_formatting",
    category: "output_format",
    section: "output_format",
    label: "Hyperlink Format",
    description: "How external URLs and action links should be presented.",
    icon: "Link",
    kind: "select",
    schema: z.enum(["descriptive_markdown", "raw_url_parentheses", "bare_url"]),
    default: "descriptive_markdown",
    options: [
      { value: "descriptive_markdown", label: "[Descriptive Text](url)", hint: "Standard accessible markdown link" },
      { value: "raw_url_parentheses", label: "Title (https://...)", hint: "Shows domain explicitly" },
      { value: "bare_url", label: "Bare URL on its own line", hint: "Best for WhatsApp message tappability" },
    ],
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 78,
    render: (val, ctx) => {
      if (ctx.channel === "whatsapp" || val === "bare_url") {
        return "Format links as plain full URLs on their own line so they are cleanly clickable in mobile messengers.";
      }
      if (val === "raw_url_parentheses") {
        return "Format links with descriptive name followed by URL in parentheses: Name (https://...).";
      }
      return "Format URLs as accessible markdown links: [Descriptive Link Text](url). Never use 'click here'.";
    },
  },
];
