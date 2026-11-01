import { NextRequest, NextResponse } from "next/server";
import {
  getTemplateById,
  getTemplateBySlug,
  agricultureTemplate,
  compilePrompt,
} from "@personaforge/core";
import { getKeyPool } from "@/lib/llm/keypool";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.INTERNAL_API_SECRET;
    const provided = req.headers.get("x-internal-secret");

    if (secret && provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { botId, text, language = "hi" } = body;

    const bot =
      getTemplateById(botId)?.config ||
      getTemplateBySlug(botId)?.config ||
      agricultureTemplate.config;

    const compiled = compilePrompt(bot, "whatsapp");

    const pool = getKeyPool();
    const key = await pool.getNextKey();

    if (!key) {
      return NextResponse.json({
        reply: "Service temporarily busy. Please try again in a moment.",
        botName: bot.name,
      });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key.key}`,
      },
      body: JSON.stringify({
        model: bot.runtime?.model || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: compiled.prompt },
          { role: "user", content: text },
        ],
        temperature: bot.runtime?.temperature ?? 0.7,
        max_tokens: 600,
      }),
    });

    if (!groqRes.ok) {
      return NextResponse.json({
        reply: "Sorry, I am having trouble processing that right now.",
        botName: bot.name,
      });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      reply,
      botName: bot.name,
      botSlug: bot.slug,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
