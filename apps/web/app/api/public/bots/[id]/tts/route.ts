import { NextRequest, NextResponse } from "next/server";
import {
  getTemplateById,
  getTemplateBySlug,
  agricultureTemplate,
  VOICE_CAPABILITIES,
} from "@personaforge/core";

// Minimal valid 1-second 16kHz mono silent WAV file in base64 for offline fallback
const SILENT_WAV_BASE64 =
  "UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP//";

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
    const { text, target_language_code = "hi-IN", speaker, pace } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text string is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Resolve bot configuration
    const bot =
      getTemplateById(id)?.config ||
      getTemplateBySlug(id)?.config ||
      agricultureTemplate.config;

    const chosenSpeaker = speaker || bot.voice?.speaker || VOICE_CAPABILITIES.tts.defaultSpeaker;
    const chosenPace = typeof pace === "number" ? pace : (bot.voice?.pace ?? 1.0);

    const sarvamApiKey = process.env.SARVAM_API_KEY;

    if (!sarvamApiKey || sarvamApiKey.includes("your-sarvam")) {
      // Offline / Developer Mock Fallback
      return NextResponse.json(
        {
          audios: [SILENT_WAV_BASE64],
          mock: true,
        },
        { headers: corsHeaders }
      );
    }

    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": sarvamApiKey,
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code,
        speaker: chosenSpeaker,
        pace: chosenPace,
        model: "bulbul:v3",
        enable_preprocessing: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Sarvam TTS error (${res.status}): ${errText.slice(0, 150)}` },
        { status: res.status, headers: corsHeaders }
      );
    }

    const data = await res.json();
    return NextResponse.json(
      {
        audios: data.audios || [SILENT_WAV_BASE64],
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500, headers: corsHeaders }
    );
  }
}
