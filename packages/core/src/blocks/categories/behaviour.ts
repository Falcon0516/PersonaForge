import { z } from "zod";
import { BlockDef } from "../types.js";

export const behaviourBlocks: BlockDef<any>[] = [
  {
    id: "behaviour.reply_length",
    category: "behaviour",
    section: "behaviour",
    label: "Reply Length Target",
    description: "Target length of generated replies.",
    icon: "Maximize2",
    kind: "select",
    schema: z.enum(["brief_telegraphic", "concise", "balanced", "comprehensive"]),
    default: "concise",
    options: [
      { value: "brief_telegraphic", label: "Ultra Brief (1-2 sentences)", hint: "Ideal for SMS, WhatsApp, and fast voice interactions" },
      { value: "concise", label: "Concise (1 short paragraph)", hint: "Quick, focused answers" },
      { value: "balanced", label: "Balanced (2-3 paragraphs)", hint: "Standard conversational explanations" },
      { value: "comprehensive", label: "Comprehensive & Detailed", hint: "Full breakdowns, guides, and edge cases" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 95,
    render: (val, ctx) => {
      if (ctx.channel === "whatsapp" || ctx.channel === "voice") {
        return "Keep replies SHORT and SIMPLE — users are on mobile devices or listening to spoken voice.";
      }
      if (val === "brief_telegraphic") return "Keep responses under 2-3 sentences. Be extremely succinct.";
      if (val === "concise") return "Keep replies concise and tightly focused. Avoid unnecessary filler words.";
      if (val === "comprehensive") return "Provide comprehensive, deeply detailed explanations covering all nuances.";
      return "Provide well-balanced responses with clear explanations.";
    },
  },
  {
    id: "behaviour.followup_questions",
    category: "behaviour",
    section: "behaviour",
    label: "Follow-Up Questions",
    description: "Whether to ask guiding questions at the end of messages.",
    icon: "HelpCircle",
    kind: "select",
    schema: z.enum(["none", "single_focused", "multiple_options"]),
    default: "single_focused",
    options: [
      { value: "none", label: "No Follow-Ups", hint: "Stop talking immediately after answering" },
      { value: "single_focused", label: "Single Focused Follow-Up", hint: "Ask one clear next step" },
      { value: "multiple_options", label: "Offer 2-3 Option Choices", hint: "Present explicit numbered paths" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 90,
    render: (val) => {
      if (val === "none") return "Do not append unprompted follow-up questions at the end of replies.";
      if (val === "multiple_options")
        return "Conclude replies with 2-3 explicit options or paths for the user to pick from.";
      return "End replies with a single, clear, relevant follow-up question to advance the conversation.";
    },
  },
  {
    id: "behaviour.proactive_suggestions",
    category: "behaviour",
    section: "behaviour",
    label: "Proactive Suggestions",
    description: "Anticipate the user's unstated next needs.",
    icon: "Lightbulb",
    kind: "toggle",
    schema: z.boolean(),
    default: true,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 88,
    render: (val) =>
      val ? "Proactively suggest logical next steps and anticipate unstated user requirements." : null,
  },
  {
    id: "behaviour.clarify_ambiguity",
    category: "behaviour",
    section: "behaviour",
    label: "Clarify Ambiguous Requests",
    description: "Ask clarifying questions before making assumptions on vague queries.",
    icon: "AlertTriangle",
    kind: "toggle",
    schema: z.boolean(),
    default: true,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 86,
    render: (val) =>
      val ? "When user intent or details are ambiguous, ask clarifying questions before executing." : null,
  },
  {
    id: "behaviour.step_by_step",
    category: "behaviour",
    section: "behaviour",
    label: "Step-by-Step Instructions",
    description: "Break complex tasks into sequentially numbered steps.",
    icon: "List",
    kind: "toggle",
    schema: z.boolean(),
    default: true,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 84,
    render: (val) =>
      val ? "Break complex instructions down into clean, numbered step-by-step sequences." : null,
  },
  {
    id: "behaviour.summary_at_end",
    category: "behaviour",
    section: "behaviour",
    label: "Executive Summary at End",
    description: "Provide a quick recap on long or technical explanations.",
    icon: "CheckSquare",
    kind: "toggle",
    schema: z.boolean(),
    default: false,
    modes: ["chat"],
    channels: ["web"],
    priority: 82,
    render: (val) =>
      val ? "Conclude long or multi-part responses with a 1-sentence 'TL;DR Summary' box." : null,
  },
  {
    id: "behaviour.confirm_understanding",
    category: "behaviour",
    section: "behaviour",
    label: "Confirm Understanding First",
    description: "Paraphrase critical user requests before taking action.",
    icon: "Check",
    kind: "toggle",
    schema: z.boolean(),
    default: false,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 80,
    render: (val) =>
      val ? "Briefly mirror or paraphrase the user's primary requirement before providing the answer." : null,
  },
  {
    id: "behaviour.next_action_offers",
    category: "behaviour",
    section: "behaviour",
    label: "Offer Action Links & Shortcuts",
    description: "Offer to perform relevant actions or provide direct booking/action links.",
    icon: "ExternalLink",
    kind: "toggle",
    schema: z.boolean(),
    default: true,
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 78,
    render: (val) =>
      val ? "Offer concrete immediate actions (e.g. links to forms, booking, or portals) where helpful." : null,
  },
  {
    id: "behaviour.greeting",
    category: "behaviour",
    section: "behaviour",
    label: "Opening Greeting Behavior",
    description: "How to open initial interactions.",
    icon: "MessageCircle",
    kind: "text",
    schema: z.string().max(200),
    default: "Welcome the user warmly and introduce your primary specialty.",
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 76,
    render: (val) => (val && val.trim() ? `Greeting protocol: ${val.trim()}` : null),
  },
  {
    id: "behaviour.farewell",
    category: "behaviour",
    section: "behaviour",
    label: "Farewell & Wrap-up Protocol",
    description: "How to conclude resolved conversations.",
    icon: "Smile",
    kind: "text",
    schema: z.string().max(200),
    default: "Wish them well and remind them you are always here if further questions arise.",
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 74,
    render: (val) => (val && val.trim() ? `Farewell protocol: ${val.trim()}` : null),
  },
  {
    id: "behaviour.small_talk",
    category: "behaviour",
    section: "behaviour",
    label: "Small Talk Allowance",
    description: "Handling non-business casual banter.",
    icon: "Coffee",
    kind: "select",
    schema: z.enum(["disallow", "polite_brief", "engage_warmly"]),
    default: "polite_brief",
    options: [
      { value: "disallow", label: "Decline & Redirect", hint: "Refuse small talk and pivot immediately to business" },
      { value: "polite_brief", label: "Polite & Pivot (1 sentence)", hint: "Acknowledge briefly, then pivot to work" },
      { value: "engage_warmly", label: "Engage Warmly", hint: "Freely chat and build rapport" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 72,
    render: (val) => {
      if (val === "disallow") return "Do not engage in small talk; politely pivot immediately to core tasks.";
      if (val === "engage_warmly") return "Engage in warm social rapport and friendly small talk when initiated by the user.";
      return "Acknowledge pleasantries with a single friendly line, then smoothly pivot to assisting with their goal.";
    },
  },
  {
    id: "behaviour.humour_allowance",
    category: "behaviour",
    section: "behaviour",
    label: "Humour & Wit Allowance",
    description: "Permission to include lighthearted wit.",
    icon: "Zap",
    kind: "toggle",
    schema: z.boolean(),
    default: false,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 70,
    render: (val) =>
      val ? "Lighthearted wit and tasteful observational humor are allowed when fitting." : null,
  },
  {
    id: "behaviour.refusal_style",
    category: "behaviour",
    section: "guardrails",
    label: "Refusal & Rejection Style",
    description: "How to decline out-of-scope or forbidden requests.",
    icon: "XCircle",
    kind: "select",
    schema: z.enum(["direct_neutral", "polite_regretful", "constructive_redirect"]),
    default: "constructive_redirect",
    options: [
      { value: "constructive_redirect", label: "Constructive Redirect", hint: "Explain refusal and offer an allowed alternative" },
      { value: "polite_regretful", label: "Polite & Apologetic", hint: "Apologize and cite policy" },
      { value: "direct_neutral", label: "Direct & Neutral", hint: "State boundary without emotional fluff" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 68,
    render: (val) => {
      if (val === "direct_neutral") return "Refusal style: State boundaries plainly and neutrally without apology.";
      if (val === "polite_regretful")
        return "Refusal style: Politely express regret and explain that company policy prevents answering.";
      return "Refusal style: State the boundary constructively and immediately suggest an alternative topic you can assist with.";
    },
  },
  {
    id: "behaviour.persistence",
    category: "behaviour",
    section: "behaviour",
    label: "Goal Persistence",
    description: "How tenaciously the bot pursues task completion.",
    icon: "Anchor",
    kind: "select",
    schema: z.enum(["gentle_yield", "encouraging_followthrough", "rigorous_completion"]),
    default: "encouraging_followthrough",
    options: [
      { value: "gentle_yield", label: "Gentle / Yields Easily", hint: "Drops topics quickly if user hesitates" },
      { value: "encouraging_followthrough", label: "Encouraging Followthrough", hint: "Gently reminds and encourages completion" },
      { value: "rigorous_completion", label: "Rigorous / Insistent", hint: "Requires explicit answers to complete workflow" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 66,
    render: (val) => {
      if (val === "rigorous_completion")
        return "Persist until the required steps or workflows are completed; ask again if user omits crucial parameters.";
      return null;
    },
  },
];
