import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as postSTT } from "@/app/api/public/bots/[id]/stt/route";
import { POST as postTTS } from "@/app/api/public/bots/[id]/tts/route";

describe("Voice Pipeline (STT & TTS) APIs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("POST /api/public/bots/[id]/stt returns speech transcript", async () => {
    const formData = new FormData();
    const fakeAudio = new Blob(["RIFF....WAVEfmt "], { type: "audio/wav" });
    formData.append("file", fakeAudio);
    formData.append("language_code", "hi-IN");

    const req = new NextRequest("http://localhost:3000/api/public/bots/kisan-mitra/stt", {
      method: "POST",
      body: formData,
    });

    const res = await postSTT(req, {
      params: Promise.resolve({ id: "kisan-mitra" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("transcript");
    expect(body).toHaveProperty("language_code");
  });

  it("POST /api/public/bots/[id]/tts synthesizes audio", async () => {
    const req = new NextRequest("http://localhost:3000/api/public/bots/kisan-mitra/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Namaste Kisan Bhai!",
        target_language_code: "hi-IN",
        speaker: "shruti",
      }),
    });

    const res = await postTTS(req, {
      params: Promise.resolve({ id: "kisan-mitra" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("audios");
    expect(Array.isArray(body.audios)).toBe(true);
    expect(body.audios.length).toBeGreaterThan(0);
  });
});
