import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as postGenerateBot } from "@/app/api/bots/generate/route";

describe("Magic Box Bot Generator API", () => {
  it("rejects empty prompt", async () => {
    const req = new NextRequest("http://localhost:3000/api/bots/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await postGenerateBot(req);
    expect(res.status).toBe(400);
  });

  it("synthesizes bot configuration from natural description", async () => {
    const req = new NextRequest("http://localhost:3000/api/bots/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "A Hindi-speaking crop advisory bot for mustard and wheat farmers",
      }),
    });

    const res = await postGenerateBot(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("config");
    expect(body.config).toHaveProperty("blocks");
    expect(body.config).toHaveProperty("blockOrder");
    expect(body.config.name).toBeTruthy();
    expect(body.config.slug).toBeTruthy();
  });
});
