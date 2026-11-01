import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as postPublicChat } from "@/app/api/public/bots/[id]/chat/route";
import { GET as getExportHtml } from "@/app/api/bots/[id]/export/html/route";
import { GET as getEmbedScript } from "@/app/embed.js/route";

describe("Public Chat & Export APIs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("POST /api/public/bots/[id]/chat rejects disabled bots or channels", async () => {
    const req = new NextRequest("http://localhost:3000/api/public/bots/nonexistent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Hi" }] }),
    });

    const res = await postPublicChat(req, {
      params: Promise.resolve({ id: "nonexistent" }),
    });

    expect(res.status).toBe(404);
  });

  it("POST /api/public/bots/[id]/chat streams for valid bot", async () => {
    const mockSSEStream = 'data: {"choices":[{"delta":{"content":"KisanMitra online!"}}]}\n\ndata: [DONE]\n\n';
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

    const req = new NextRequest("http://localhost:3000/api/public/bots/kisan-mitra/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Mera gehu kharab ho raha hai" }],
      }),
    });

    const res = await postPublicChat(req, {
      params: Promise.resolve({ id: "kisan-mitra" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
    expect(res.headers.get("X-PersonaForge-Bot")).toBeTruthy();
  });

  it("GET /api/bots/[id]/export/html returns single-file HTML attachment", async () => {
    const req = new NextRequest("http://localhost:3000/api/bots/kisan-mitra/export/html?mode=hosted");
    const res = await getExportHtml(req, {
      params: Promise.resolve({ id: "kisan-mitra" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(res.headers.get("Content-Disposition")).toContain("attachment; filename=");

    const html = await res.text();
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("GET /embed.js returns JavaScript embed widget script", async () => {
    const req = new NextRequest("http://localhost:3000/embed.js?bot=kisanmitra");
    const res = await getEmbedScript(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/javascript");

    const script = await res.text();
    expect(script).toContain("pf-launcher-btn");
    expect(script).toContain("kisanmitra");
  });
});
