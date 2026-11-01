import { describe, it, expect } from "vitest";
import { compile } from "./compiler.js";
import { agricultureTemplate } from "../templates/agriculture.js";
import { BotConfig } from "../schemas/bot.js";

describe("Prompt Compiler", () => {
  it("compiles standard configuration deterministically", () => {
    const result1 = compile(agricultureTemplate.config, { channel: "web" });
    const result2 = compile(agricultureTemplate.config, { channel: "web" });

    expect(result1.prompt).toBe(result2.prompt);
    expect(result1.tokenEstimate).toBeGreaterThan(50);
    expect(result1.warnings).toHaveLength(0);
  });

  it("produces line-by-line trace mapping output lines to block IDs", () => {
    const result = compile(agricultureTemplate.config, { channel: "web" });
    const lines = result.prompt.split("\n");

    expect(Object.keys(result.trace).length).toBe(lines.length);

    // Assert line 1 maps to title
    expect(result.trace[1]).toBe("system.title");

    // Assert every non-empty line has a valid trace ID
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const blockId = result.trace[lineNum];
      expect(blockId).toBeDefined();
    }
  });

  it("applies channel-specific constraints for WhatsApp", () => {
    const result = compile(agricultureTemplate.config, { channel: "whatsapp" });

    // WhatsApp length cap should appear in prompt
    expect(result.prompt).toContain("WHATSAPP LENGTH BUDGET");
    expect(result.prompt).toContain("single clean message");
  });

  it("applies channel-specific constraints for Voice mode", () => {
    const voiceConfig: BotConfig = {
      ...agricultureTemplate.config,
      mode: "voice",
    };

    const result = compile(voiceConfig, { channel: "voice" });
    expect(result.prompt).toContain("SPOKEN VOICE RULES");
    expect(result.prompt).toContain("Do NOT use bullet points");
  });

  it("performs compaction pass when prompt exceeds maxTokenBudget", () => {
    // Compile with an intentionally small budget (e.g. 150 tokens)
    const result = compile(agricultureTemplate.config, {
      channel: "web",
      maxTokenBudget: 150,
    });

    expect(result.droppedBlocks.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes("Compaction pass dropped"))).toBe(true);
    expect(result.tokenEstimate).toBeLessThanOrEqual(250);
  });

  it("handles expert.replace override correctly", () => {
    const overrideConfig: BotConfig = {
      ...agricultureTemplate.config,
      expert: {
        replace: "YOU ARE A MOCKED OVERRIDE BOT. DO WHAT I SAY.",
      },
    };

    const result = compile(overrideConfig);
    expect(result.prompt).toBe("YOU ARE A MOCKED OVERRIDE BOT. DO WHAT I SAY.");
    expect(result.warnings).toContain("Compiler bypassed: full override active via expert.replace.");
    expect(result.trace[1]).toBe("expert.replace");
  });

  it("handles expert.append correctly", () => {
    const appendConfig: BotConfig = {
      ...agricultureTemplate.config,
      expert: {
        append: "CRITICAL: ALWAYS INCLUDE ORDER ID IN RESPONSES.",
      },
    };

    const result = compile(appendConfig);
    expect(result.prompt).toContain("## 12. Expert Additions");
    expect(result.prompt).toContain("CRITICAL: ALWAYS INCLUDE ORDER ID IN RESPONSES.");
  });
});
