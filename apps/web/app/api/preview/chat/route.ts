import { NextRequest, NextResponse } from "next/server";
import { compilePrompt, BotConfigSchema, ChannelSchema } from "@personaforge/core";
import { createSSEStreamResponse, ChatMessage } from "@/lib/llm/streaming";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { config, messages, channel = "web" } = body;

    if (!config || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request payload. 'config' and 'messages' array are required." },
        { status: 400 }
      );
    }

    // Validate channel
    const channelParse = ChannelSchema.safeParse(channel);
    const validChannel = channelParse.success ? channelParse.data : "web";

    // Validate bot config
    const configParse = BotConfigSchema.safeParse(config);
    if (!configParse.success) {
      return NextResponse.json(
        {
          error: "Invalid bot configuration",
          details: configParse.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
        },
        { status: 422 }
      );
    }

    const validConfig = configParse.data;

    // Compile deterministic system prompt
    const compiled = compilePrompt(validConfig, validChannel);

    // Prepare message sequence with compiled system prompt
    const chatMessages: ChatMessage[] = [
      {
        role: "system",
        content: compiled.prompt,
      },
    ];

    // Filter incoming user & assistant messages
    for (const msg of messages) {
      if (msg && (msg.role === "user" || msg.role === "assistant")) {
        chatMessages.push({
          role: msg.role,
          content: msg.content || "",
          image: typeof msg.image === "string" ? msg.image : undefined,
        });
      }
    }

    // Determine target model and parameters from bot runtime
    const targetModel = validConfig.runtime?.model || "llama-3.3-70b-versatile";
    const temperature = validConfig.runtime?.temperature ?? 0.7;
    const maxTokens = validConfig.runtime?.maxTokens ?? 1024;

    return createSSEStreamResponse(
      {
        messages: chatMessages,
        model: targetModel,
        temperature,
        maxTokens,
        signal: req.signal,
      },
      {
        headers: {
          "X-PersonaForge-Channel": validChannel,
          "X-PersonaForge-Prompt-Tokens": String(compiled.tokenEstimate),
        },
      }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
