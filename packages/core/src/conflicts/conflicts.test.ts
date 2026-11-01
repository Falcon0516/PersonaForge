import { describe, it, expect } from "vitest";
import { detectConflicts } from "./conflicts.js";
import { BotConfig } from "../schemas/bot.js";
import { agricultureTemplate } from "../templates/agriculture.js";

describe("Conflict Engine", () => {
  it("detects no conflicts on clean template configuration", () => {
    const conflicts = detectConflicts(agricultureTemplate.config);
    expect(conflicts).toHaveLength(0);
  });

  it("detects conflict when voice mode bot has rich markdown enabled", () => {
    const badConfig: BotConfig = {
      ...agricultureTemplate.config,
      mode: "voice",
      blocks: {
        ...agricultureTemplate.config.blocks,
        "output.markdown": true,
      },
    };

    const conflicts = detectConflicts(badConfig);
    expect(conflicts.some((c) => c.id === "voice-mode-markdown")).toBe(true);

    const match = conflicts.find((c) => c.id === "voice-mode-markdown");
    expect(match?.fix).toEqual({
      blockId: "output.markdown",
      value: false,
      action: "set",
    });
  });

  it("detects conflict when strict knowledge grounding is enabled without knowledge text", () => {
    const badConfig: BotConfig = {
      ...agricultureTemplate.config,
      blocks: {
        ...agricultureTemplate.config.blocks,
        "knowledge.strict_grounding": true,
        "knowledge.text": "",
        "knowledge.faq": [],
      },
    };

    const conflicts = detectConflicts(badConfig);
    expect(conflicts.some((c) => c.id === "strict-knowledge-empty")).toBe(true);
  });

  it("detects conflict between high formality and Gen-Z slang", () => {
    const badConfig: BotConfig = {
      ...agricultureTemplate.config,
      blocks: {
        ...agricultureTemplate.config.blocks,
        "personality.formality": 0.9,
        "tone.slang": true,
      },
    };

    const conflicts = detectConflicts(badConfig);
    expect(conflicts.some((c) => c.id === "formality-slang-conflict")).toBe(true);
  });

  it("detects conflict between high empathy and sarcastic banter", () => {
    const badConfig: BotConfig = {
      ...agricultureTemplate.config,
      blocks: {
        ...agricultureTemplate.config.blocks,
        "personality.empathy": 0.9,
        "personality.sarcasm": true,
      },
    };

    const conflicts = detectConflicts(badConfig);
    expect(conflicts.some((c) => c.id === "empathy-sarcasm-conflict")).toBe(true);
  });
});
