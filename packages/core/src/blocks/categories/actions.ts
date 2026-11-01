import { z } from "zod";
import { BlockDef } from "../types.js";

export const actionBlocks: BlockDef<any>[] = [
  {
    id: "actions.lead_capture",
    category: "actions_and_integrations",
    section: "actions",
    label: "Lead Capture Workflow",
    description: "Fields to collect when a visitor expresses buying interest.",
    icon: "UserPlus",
    kind: "list",
    schema: z.array(z.string()).default(["name", "email"]),
    default: ["name", "email"],
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 95,
    render: (val) => {
      if (!val || val.length === 0) return null;
      return `LEAD CAPTURE: When a user expresses intent to purchase, sign up, or speak with sales, politely request the following details one at a time: ${val.join(", ")}.`;
    },
  },
  {
    id: "actions.booking_link",
    category: "actions_and_integrations",
    section: "actions",
    label: "Meeting / Demo Scheduling Link",
    description: "Direct URL to booking calendar (e.g., Cal.com, Calendly).",
    icon: "Calendar",
    kind: "text",
    schema: z.string().url().or(z.literal("")).default(""),
    default: "",
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 92,
    render: (val) =>
      val && val.trim()
        ? `SCHEDULE LINK: When the user requests a meeting, demo, or phone consultation, share this link: ${val.trim()}.`
        : null,
  },
  {
    id: "actions.human_handoff",
    category: "actions_and_integrations",
    section: "actions",
    label: "Human Agent Handoff",
    description: "Action to take when user requests a human operator.",
    icon: "Headphones",
    kind: "select",
    schema: z.enum(["ticket_form", "phone_number", "chat_transfer", "email_dispatch"]),
    default: "ticket_form",
    options: [
      { value: "ticket_form", label: "Provide Support Ticket Form", hint: "Share helpdesk portal link" },
      { value: "phone_number", label: "Share Direct Hotline Phone", hint: "Provide customer care phone number" },
      { value: "chat_transfer", label: "Initiate Live Chat Routing", hint: "Signal platform handoff" },
      { value: "email_dispatch", label: "Direct to Support Email", hint: "Give support email address" },
    ],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 90,
    render: (val) => {
      switch (val) {
        case "phone_number":
          return "HUMAN HANDOFF: If the user insists on human assistance, provide the official telephone hotline and operating hours.";
        case "chat_transfer":
          return "HUMAN HANDOFF: If the user asks for a live agent, acknowledge the request, summarize their query, and emit [ACTION: HANDOFF].";
        case "email_dispatch":
          return "HUMAN HANDOFF: If the user requires human follow-up, direct them to send their inquiry to the support email address.";
        case "ticket_form":
        default:
          return "HUMAN HANDOFF: If the user asks for a human, offer to generate a priority support ticket for our human staff.";
      }
    },
  },
  {
    id: "actions.rest_lookup",
    category: "actions_and_integrations",
    section: "actions",
    label: "REST API Live Lookup (SSRF Protected)",
    description: "Generalised lookup for live marketplace rates, order tracking, or inventory.",
    icon: "Database",
    kind: "text",
    schema: z.string().max(300).default(""),
    default: "",
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 88,
    render: (val) =>
      val && val.trim()
        ? `EXTERNAL DATA LOOKUP: Live data queries can be fetched via verified endpoints (${val.trim()}). Any returned live data will be supplied in your runtime context.`
        : null,
  },
  {
    id: "actions.escalation_keywords",
    category: "actions_and_integrations",
    section: "actions",
    label: "Escalation Trigger Keywords",
    description: "Keywords that trigger an immediate handoff or priority notice.",
    icon: "AlertCircle",
    kind: "list",
    schema: z.array(z.string()).default(["human", "agent", "supervisor", "representative"]),
    default: ["human", "agent", "supervisor", "representative"],
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 86,
    render: (val) => {
      if (!val || val.length === 0) return null;
      return `ESCALATION TRIGGERS: Recognize these priority escalation keywords: ${val.join(", ")}. When triggered, prioritize handoff procedures.`;
    },
  },
  {
    id: "actions.order_lookup",
    category: "actions_and_integrations",
    section: "actions",
    label: "Order Status Tracking Link",
    description: "Customer self-service tracking URL.",
    icon: "Package",
    kind: "text",
    schema: z.string().url().or(z.literal("")).default(""),
    default: "",
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 84,
    render: (val) =>
      val && val.trim()
        ? `ORDER LOOKUP: For order tracking inquiries, direct the user to the self-service tracker at: ${val.trim()}.`
        : null,
  },
  {
    id: "actions.payment_link",
    category: "actions_and_integrations",
    section: "actions",
    label: "Direct Payment Link",
    description: "Checkout portal or invoice payment URL.",
    icon: "CreditCard",
    kind: "text",
    schema: z.string().url().or(z.literal("")).default(""),
    default: "",
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 82,
    render: (val) =>
      val && val.trim()
        ? `PAYMENT ACTION: Direct invoice and bill payments to: ${val.trim()}.`
        : null,
  },
  {
    id: "actions.email_notify",
    category: "actions_and_integrations",
    section: "actions",
    label: "Internal Alert Recipient Email",
    description: "Internal team email alerted when critical leads or escalations occur.",
    icon: "Mail",
    kind: "text",
    schema: z.string().email().or(z.literal("")).default(""),
    default: "",
    modes: ["chat"],
    channels: ["web", "whatsapp"],
    priority: 80,
    render: (val) => (val && val.trim() ? `Lead notifications are dispatched internally to ${val.trim()}.` : null),
  },
  {
    id: "actions.calendar_link",
    category: "actions_and_integrations",
    section: "actions",
    label: "Public Calendar Link",
    description: "Link to company events or webinar calendar.",
    icon: "CalendarCheck",
    kind: "text",
    schema: z.string().url().or(z.literal("")).default(""),
    default: "",
    modes: ["chat"],
    channels: ["web"],
    priority: 78,
    render: (val) => (val && val.trim() ? `Event calendar: ${val.trim()}.` : null),
  },
  {
    id: "actions.sheet_log",
    category: "actions_and_integrations",
    section: "actions",
    label: "CRM / Spreadsheet Logging",
    description: "Confirm that captured leads and conversation metrics are synced to the backend log.",
    icon: "Table",
    kind: "toggle",
    schema: z.boolean(),
    default: true,
    modes: ["chat", "voice"],
    channels: ["web", "voice", "whatsapp"],
    priority: 76,
    render: (val) => (val ? "Assure user that their information is recorded in the customer registry." : null),
  },
];
