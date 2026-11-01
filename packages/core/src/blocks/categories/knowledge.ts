import { z } from "zod";
import { BlockDef } from "../types.js";

const FaqItem = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const knowledgeBlocks: BlockDef<any>[] = [
  {
    id: "knowledge.text",
    category: "knowledge",
    section: "knowledge_rules",
    label: "Grounded Knowledge Text",
    description: "Curated domain reference facts and reference material.",
    icon: "Database",
    kind: "textarea",
    schema: z.string().max(8000),
    default: "",
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 95,
    render: (val) => (val && val.trim() ? `Knowledge Base Information:\n${val.trim()}` : null),
  },
  {
    id: "knowledge.faq",
    category: "knowledge",
    section: "knowledge_rules",
    label: "Curated FAQ Pairs",
    description: "Frequently asked questions and exact verified answers.",
    icon: "HelpCircle",
    kind: "faq",
    schema: z.array(FaqItem).default([]),
    default: [],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 90,
    render: (val: { question: string; answer: string }[]) => {
      if (!val || val.length === 0) return null;
      const formatted = val
        .map((item, idx) => `Q${idx + 1}: ${item.question}\nA${idx + 1}: ${item.answer}`)
        .join("\n\n");
      return `Frequently Asked Questions (Verified):\n${formatted}`;
    },
  },
  {
    id: "knowledge.strict_grounding",
    category: "knowledge",
    section: "knowledge_rules",
    label: "Answer Only From Knowledge",
    description: "Strictly forbid answering using general AI pretraining when outside knowledge base.",
    icon: "Lock",
    kind: "toggle",
    schema: z.boolean(),
    default: false,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 88,
    render: (val) =>
      val
        ? "STRICT GROUNDING: Answer questions ONLY using facts provided in the knowledge base. If the required information is not explicitly documented, do not guess or hallucinate."
        : null,
    conflicts: [
      {
        with: "knowledge.text",
        when: (strictVal, textVal) =>
          Boolean(strictVal) && (!textVal || (typeof textVal === "string" && !textVal.trim())),
        message: "'Answer only from knowledge' is enabled, but the knowledge text is empty.",
        fix: { blockId: "knowledge.strict_grounding", value: false, action: "set" },
      },
    ],
  },
  {
    id: "knowledge.citation_style",
    category: "knowledge",
    section: "output_format",
    label: "Citation & Sourcing Style",
    description: "How knowledge sources are cited in messages.",
    icon: "Bookmark",
    kind: "select",
    schema: z.enum(["none", "inline_brackets", "source_footnotes", "spoken_attribution"]),
    default: "none",
    options: [
      { value: "none", label: "No Citations", hint: "Seamless natural text" },
      { value: "inline_brackets", label: "Inline Brackets [Source]", hint: "Classic academic/search brackets" },
      { value: "source_footnotes", label: "Footnote Links at End", hint: "List sources at bottom of response" },
      { value: "spoken_attribution", label: "Spoken Attribution", hint: "'According to our documentation...'" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 84,
    render: (val, ctx) => {
      if (val === "none") return null;
      if (ctx.channel === "voice" || val === "spoken_attribution") {
        return "Attribute key facts smoothly in spoken phrasing (e.g., 'According to our guidelines...').";
      }
      if (val === "inline_brackets") {
        return "Include bracketed citations [Source: ...] immediately following cited claims.";
      }
      if (val === "source_footnotes") {
        return "List referenced documentation sources in a brief 'Sources:' section at the conclusion of your reply.";
      }
      return null;
    },
  },
  {
    id: "knowledge.unknown_answer",
    category: "knowledge",
    section: "knowledge_rules",
    label: "Unknown Answer Behaviour",
    description: "What to do when the answer is not known.",
    icon: "AlertCircle",
    kind: "select",
    schema: z.enum(["admit_honestly", "offer_escalation", "general_reasoning"]),
    default: "admit_honestly",
    options: [
      { value: "admit_honestly", label: "Admit Honestly & Decline", hint: "Clearly state that information is unavailable" },
      { value: "offer_escalation", label: "Admit & Connect to Human", hint: "Acknowledge lack of data and direct to human team" },
      { value: "general_reasoning", label: "General Knowledge Fallback", hint: "Use general knowledge while clarifying it is unverified" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 82,
    render: (val) => {
      if (val === "offer_escalation") {
        return "When you do not possess specific factual data, clearly say so and immediately offer to connect the user with the human support team.";
      }
      if (val === "general_reasoning") {
        return "If official data is unavailable, provide helpful general principles while explicitly noting that this is not official company policy.";
      }
      return "When you do not know the answer or lack verified data, honestly admit it in simple terms. Never invent details.";
    },
  },
  {
    id: "knowledge.freshness_note",
    category: "knowledge",
    section: "knowledge_rules",
    label: "Knowledge Freshness & Cutoff",
    description: "Temporal context regarding rates, schedules, or updates.",
    icon: "Calendar",
    kind: "text",
    schema: z.string().max(200),
    default: "",
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 80,
    render: (val) => (val && val.trim() ? `Information Freshness Note: ${val.trim()}` : null),
  },
  {
    id: "knowledge.document_upload",
    category: "knowledge",
    section: "knowledge_rules",
    label: "Document Reference Pointer",
    description: "Title of uploaded handbook or reference PDF.",
    icon: "File",
    kind: "file",
    schema: z.string().max(255).default(""),
    default: "",
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 78,
    render: (val) => (val && val.trim() ? `Refer to uploaded document context: ${val.trim()}.` : null),
  },
  {
    id: "knowledge.url_ingest",
    category: "knowledge",
    section: "knowledge_rules",
    label: "Official Documentation URL",
    description: "Reference link for official documentation site.",
    icon: "Globe",
    kind: "text",
    schema: z.string().url().or(z.literal("")).default(""),
    default: "",
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 76,
    render: (val) =>
      val && val.trim()
        ? `Official documentation portal: ${val.trim()}. Provide this URL when users require full documentation.`
        : null,
  },
];
