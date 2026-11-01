import { describe, it, expect } from "vitest";
import { scorePrompt } from "./scorer.js";
import { agricultureTemplate } from "../templates/agriculture.js";
import { BotConfig } from "../schemas/bot.js";

describe("Deterministic Quality Scorer", () => {
  it("scores production template high (>= 90)", () => {
    const result = scorePrompt(agricultureTemplate.config);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.checks.length).toBe(9);

    const passedChecks = result.checks.filter((c) => c.passed);
    expect(passedChecks.length).toBeGreaterThanOrEqual(8);
  });

  it("penalizes unconfigured bare bot and gives actionable hints", () => {
    const bareConfig: BotConfig = {
      schemaVersion: 1,
      id: "00000000-0000-0000-0000-000000000099",
      slug: "bare-bot",
      name: "",
      mode: "chat",
      industry: "general",
      blocks: {
        "guardrails.prompt_leak_protection": false,
        "guardrails.jailbreak_resistance": false,
      },
      expert: {},
      runtime: {
        model: "llama-3.3-70b-versatile",
        fallbackModels: [],
        temperature: 0.7,
        maxTokens: 800,
        memory: "none",
        memoryWindow: 5,
        cache: false,
        moderation: "off",
      },
      ui: {
        theme: "auto",
        primaryColor: "#2563eb",
        accentColor: "#38bdf8",
        surfaceColor: "#ffffff",
        backgroundColor: "#f8fafc",
        backgroundType: "solid",
        fontFamily: "Inter",
        bubbleStyle: "rounded",
        density: "comfortable",
        avatarUrl: "",
        avatarEmoji: "🤖",
        headerTitle: "Assistant",
        headerSubtitle: "Online",
        greeting: "Hello",
        suggestedChips: [],
        showTimestamps: true,
        showFeedback: true,
        showCopyButton: true,
        showPoweredBy: true,
        launcherIcon: "chat",
        launcherPosition: "bottom-right",
        orbStyle: "fluid-glow",
      },
      channels: {
        web: { enabled: true },
        whatsapp: { enabled: false, replyCharCap: 1500, voiceNoteReplies: false, imageUnderstanding: false },
      },
    };

    const result = scorePrompt(bareConfig);
    expect(result.score).toBeLessThan(50);

    const failedChecks = result.checks.filter((c) => !c.passed);
    expect(failedChecks.length).toBeGreaterThanOrEqual(3);
    for (const failed of failedChecks) {
      expect(failed.actionHint).toBeDefined();
    }
  });
});
