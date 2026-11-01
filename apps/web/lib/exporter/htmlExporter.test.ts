import { describe, it, expect } from "vitest";
import { generateStandaloneHtml } from "./htmlExporter";
import { agricultureTemplate } from "@personaforge/core";

describe("Standalone Single-File HTML Exporter", () => {
  it("generates Hosted Mode HTML without leaking prompt or server credentials", () => {
    const html = generateStandaloneHtml({
      config: agricultureTemplate.config,
      mode: "hosted",
      baseUrl: "https://personaforge.dev",
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("api/public/bots");
    expect(html).not.toContain("gsk_");
    expect(html).not.toContain("GROQ_API_KEY");
    // Ensure compiled prompt is NOT in hosted HTML
    expect(html).toContain('const compiledSystemPrompt = null;');
  });

  it("generates BYOK Mode HTML with client key modal and compiled prompt", () => {
    const html = generateStandaloneHtml({
      config: agricultureTemplate.config,
      mode: "byok",
      baseUrl: "https://personaforge.dev",
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("byokModal");
    expect(html).toContain("api.groq.com/openai/v1/chat/completions");
    // Ensure compiled prompt IS in BYOK HTML
    expect(html).toContain("compiledSystemPrompt = ");
    // Ensure NO server keys are leaked into the file
    expect(html).not.toMatch(/gsk_[a-zA-Z0-9]{15,}/);
  });
});
