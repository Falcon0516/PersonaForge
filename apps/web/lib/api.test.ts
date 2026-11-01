import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getAdminKeys, POST as postAdminKeys } from "@/app/api/admin/keys/route";
import { POST as postPreviewChat } from "@/app/api/preview/chat/route";
import { agricultureTemplate } from "@personaforge/core";

describe("Admin Keys API", () => {
  it("GET /api/admin/keys returns key list and telemetry", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/keys");
    const res = await getAdminKeys(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("keys");
    expect(body).toHaveProperty("totalKeys");
    expect(body).toHaveProperty("timestamp");
  });

  it("POST /api/admin/keys handles reset actions", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset-cooldown", keyIndex: 1 }),
    });
    const res = await postAdminKeys(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

describe("Preview Chat API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("POST /api/preview/chat rejects missing config", async () => {
    const req = new NextRequest("http://localhost:3000/api/preview/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    });

    const res = await postPreviewChat(req);
    expect(res.status).toBe(400);
  });

  it("POST /api/preview/chat compiles prompt and initiates stream", async () => {
    // Mock Groq fetch
    const mockSSEStream = 'data: {"choices":[{"delta":{"content":"Ram Ram! "}}]}\n\ndata: [DONE]\n\n';
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(mockSSEStream));
        controller.close();
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: stream,
      })
    );

    const req = new NextRequest("http://localhost:3000/api/preview/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: agricultureTemplate.config,
        messages: [{ role: "user", content: "Mera gehu kharab ho raha hai" }],
        channel: "web",
      }),
    });

    const res = await postPreviewChat(req);
    if (res.status !== 200) {
      console.log("500 details:", await res.json());
    }
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    expect(res.headers.get("X-PersonaForge-Channel")).toBe("web");
    expect(Number(res.headers.get("X-PersonaForge-Prompt-Tokens"))).toBeGreaterThan(0);
  });
});
