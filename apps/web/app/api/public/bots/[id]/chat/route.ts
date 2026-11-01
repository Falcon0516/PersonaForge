import { NextRequest, NextResponse } from "next/server";
import {
  getTemplateById,
  getTemplateBySlug,
  agricultureTemplate,
  compilePrompt,
} from "@personaforge/core";
import { getRedisClient } from "@/lib/redis/client";
import { createSSEStreamResponse, ChatMessage } from "@/lib/llm/streaming";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { messages } = body;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid 'messages' array" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Resolve bot configuration
    const bot =
      getTemplateById(id)?.config ||
      getTemplateBySlug(id)?.config ||
      (id === "kisan-mitra" || id.includes("agriculture") ? agricultureTemplate.config : null);

    if (!bot) {
      return NextResponse.json(
        { error: "Bot not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Kill switch: Check if Web channel is enabled
    if (bot.channels?.web?.enabled === false) {
      return NextResponse.json(
        { error: "Web channel is disabled for this bot" },
        { status: 403, headers: corsHeaders }
      );
    }

    // IP Rate Limiting (30 req / min)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const redis = getRedisClient();
    const rateLimitKey = `rate:ip:${ip}:${Math.floor(Date.now() / 60000)}`;
    const currentCount = await redis.incr(rateLimitKey);
    if (currentCount === 1) {
      await redis.set(rateLimitKey, 1, { ex: 60 });
    } else if (currentCount > 30) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait 60 seconds." },
        { status: 429, headers: corsHeaders }
      );
    }

    // Daily Token Quota (100,000 tokens / day / bot)
    const today = new Date().toISOString().slice(0, 10);
    const quotaKey = `quota:bot:${bot.id}:${today}`;
    const consumedTokens = (await redis.get<number>(quotaKey)) || 0;
    if (consumedTokens > 100000) {
      return NextResponse.json(
        { error: "Daily token quota exceeded for this bot. Please contact admin." },
        { status: 429, headers: corsHeaders }
      );
    }

    // Compile deterministic system prompt
    const compiled = compilePrompt(bot, "web");

    // Track estimated tokens used
    await redis.incr(quotaKey);

    const chatMessages: ChatMessage[] = [
      { role: "system", content: compiled.prompt },
    ];

    for (const m of messages) {
      if (m.role === "user" || m.role === "assistant") {
        chatMessages.push({
          role: m.role,
          content: m.content || "",
          image: typeof m.image === "string" ? m.image : undefined,
        });
      }
    }

    const model = bot.runtime?.model || "llama-3.3-70b-versatile";
    const temperature = bot.runtime?.temperature ?? 0.7;
    const maxTokens = bot.runtime?.maxTokens ?? 1024;

    return createSSEStreamResponse(
      {
        messages: chatMessages,
        model,
        temperature,
        maxTokens,
        signal: req.signal,
      },
      {
        headers: {
          ...corsHeaders,
          "X-PersonaForge-Bot": bot.slug,
          "X-PersonaForge-Tokens": String(compiled.tokenEstimate),
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers: corsHeaders });
  }
}
