import { NextRequest, NextResponse } from "next/server";
import { getTemplateById, getTemplateBySlug, agricultureTemplate } from "@personaforge/core";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await req.formData().catch(() => null);

    if (!formData) {
      return NextResponse.json({ error: "Missing multipart/form-data body" }, { status: 400 });
    }

    const file = formData.get("file") as Blob | null;
    const languageCode = (formData.get("language_code") as string) || "hi-IN";

    if (!file) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    // Resolve bot configuration
    const bot =
      getTemplateById(id)?.config ||
      getTemplateBySlug(id)?.config ||
      agricultureTemplate.config;

    const sarvamApiKey = process.env.SARVAM_API_KEY;

    if (!sarvamApiKey || sarvamApiKey.includes("your-sarvam")) {
      // Offline / Developer Mock Fallback
      return NextResponse.json({
        transcript: "Mera gehu kharab ho raha hai, pattiya pili pad rahi hai",
        language_code: languageCode,
        mock: true,
      });
    }

    const sarvamForm = new FormData();
    sarvamForm.append("file", file, "input.wav");
    sarvamForm.append("model", "saarika:v2.5");
    sarvamForm.append("language_code", languageCode);

    const res = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": sarvamApiKey,
      },
      body: sarvamForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Sarvam STT error (${res.status}): ${errText.slice(0, 150)}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      transcript: data.transcript || "",
      language_code: data.language_code || languageCode,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
