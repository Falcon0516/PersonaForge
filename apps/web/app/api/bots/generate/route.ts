import { NextRequest, NextResponse } from "next/server";
import {
  getAllTemplates,
  getAllBlocks,
  BotConfigSchema,
  BotConfig,
} from "@personaforge/core";
import { getKeyPool } from "@/lib/llm/keypool";

export async function POST(req: NextRequest) {
  try {
    const { prompt, industry } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Description prompt is required" }, { status: 400 });
    }

    const templates = getAllTemplates();
    const blocks = getAllBlocks();
    const pool = getKeyPool();
    const key = await pool.getNextKey();

    // If Groq key is available, query LLM for customized synthesis
    if (key) {
      try {
        const availableBlockIds = blocks.map((b) => `${b.id} (${b.category}): ${b.description}`).join("\n");

        const systemMessage = `You are the PersonaForge AI Architect. Given the user's bot concept, generate a structured JSON bot configuration conforming to PersonaForge blocks.
Available block IDs:
${availableBlockIds}

Rules:
1. Return ONLY a valid JSON object matching BotConfig structure:
{
  "schemaVersion": 1,
  "id": "${crypto.randomUUID()}",
  "slug": "<3-30 lowercase chars hyphenated>",
  "name": "<bot name>",
  "mode": "chat",
  "industry": "${industry || "general"}",
  "blocks": {
    "identity.name_role": { "name": "<bot name>", "role": "<role description>" },
    "tone.conversational": {},
    "output.markdown": {},
    "guardrails.hallucination": {}
  },
  "blockOrder": ["identity.name_role", "tone.conversational", "output.markdown", "guardrails.hallucination"],
  "runtime": { "model": "llama-3.3-70b-versatile", "temperature": 0.7, "maxTokens": 800 },
  "ui": { "theme": "dark", "title": "<bot name>", "welcomeMessage": "<welcome message>" },
  "channels": { "web": { "enabled": true }, "whatsapp": { "enabled": false } }
}
Do not include markdown code ticks, output only raw JSON.`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key.key}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemMessage },
              { role: "user", content: `Generate a bot for: ${prompt}` },
            ],
            temperature: 0.4,
            max_tokens: 1500,
            response_format: { type: "json_object" },
          }),
        });

        if (response.ok) {
          const resJson = await response.json();
          const content = resJson.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            const validated = BotConfigSchema.safeParse(parsed);
            if (validated.success) {
              return NextResponse.json({ config: validated.data, generatedBy: "groq" });
            }
          }
        }
      } catch {
        // Fallback to intelligent template synthesizer
      }
    }

    // Intelligent heuristic synthesizer
    const lower = prompt.toLowerCase();
    let bestTemplate = templates[0]!;

    if (lower.includes("farm") || lower.includes("crop") || lower.includes("kisan") || lower.includes("agriculture")) {
      bestTemplate = templates.find((t) => t.id === "template-agriculture") || bestTemplate;
    } else if (lower.includes("shop") || lower.includes("store") || lower.includes("order") || lower.includes("cart") || lower.includes("ecommerce")) {
      bestTemplate = templates.find((t) => t.id === "template-ecommerce") || bestTemplate;
    } else if (lower.includes("health") || lower.includes("doctor") || lower.includes("clinic") || lower.includes("patient")) {
      bestTemplate = templates.find((t) => t.id === "template-healthcare") || bestTemplate;
    } else if (lower.includes("bank") || lower.includes("loan") || lower.includes("finance") || lower.includes("invest")) {
      bestTemplate = templates.find((t) => t.id === "template-finance") || bestTemplate;
    } else if (lower.includes("tech") || lower.includes("support") || lower.includes("bug") || lower.includes("ticket")) {
      bestTemplate = templates.find((t) => t.id === "template-tech-helpdesk") || bestTemplate;
    } else if (lower.includes("school") || lower.includes("tutor") || lower.includes("course") || lower.includes("education")) {
      bestTemplate = templates.find((t) => t.id === "template-education") || bestTemplate;
    } else if (lower.includes("hotel") || lower.includes("flight") || lower.includes("trip") || lower.includes("travel")) {
      bestTemplate = templates.find((t) => t.id === "template-travel") || bestTemplate;
    } else if (lower.includes("property") || lower.includes("real estate") || lower.includes("rent") || lower.includes("apartment")) {
      bestTemplate = templates.find((t) => t.id === "template-real-estate") || bestTemplate;
    } else if (lower.includes("gov") || lower.includes("scheme") || lower.includes("yojana") || lower.includes("citizen")) {
      bestTemplate = templates.find((t) => t.id === "template-government") || bestTemplate;
    }

    // Clone and customize name/id and ensure blockOrder
    const generated: BotConfig = {
      ...JSON.parse(JSON.stringify(bestTemplate.config)),
      id: crypto.randomUUID(),
      name: prompt.length < 35 ? prompt : `${bestTemplate.name} (Customized)`,
      slug: `bot-${Date.now().toString(36)}`,
      blockOrder: bestTemplate.config.blockOrder || Object.keys(bestTemplate.config.blocks),
    };

    return NextResponse.json({ config: generated, generatedBy: "template-heuristic" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
