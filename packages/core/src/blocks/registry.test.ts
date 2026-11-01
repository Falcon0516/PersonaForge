import { describe, it, expect } from "vitest";
import { getAllBlocks, getBlock, validateRegistry } from "./registry.js";
import { PROMPT_SECTIONS, CATEGORIES } from "../schemas/sections.js";

describe("Block Registry", () => {
  it("validates registry integrity at startup", () => {
    const result = validateRegistry();
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("contains at least 120 blocks across all 15 categories", () => {
    const all = getAllBlocks();
    expect(all.length).toBeGreaterThanOrEqual(120);

    const categoriesFound = new Set(all.map((b) => b.category));
    expect(categoriesFound.size).toBe(15);
    for (const cat of CATEGORIES) {
      expect(categoriesFound.has(cat)).toBe(true);
    }
  });

  it("ensures every block has valid section, default value schema, and pure render", () => {
    const all = getAllBlocks();
    const ctx = {
      channel: "web" as const,
      mode: "chat" as const,
      botName: "TestBot",
      industry: "general",
    };

    for (const block of all) {
      expect(PROMPT_SECTIONS).toContain(block.section);
      expect(CATEGORIES).toContain(block.category);
      expect(block.priority).toBeTypeOf("number");

      // Verify default passes schema
      const parseResult = block.schema.safeParse(block.default);
      expect(parseResult.success, `Block ${block.id} default failed schema`).toBe(true);

      // Verify render is deterministic and does not throw
      const renderA = block.render(block.default, ctx);
      const renderB = block.render(block.default, ctx);
      expect(renderA).toBe(renderB);
    }
  });

  it("can lookup blocks by ID", () => {
    const nameBlock = getBlock("identity.name");
    expect(nameBlock).toBeDefined();
    expect(nameBlock?.label).toBe("Persona Name");

    const nonExistent = getBlock("nonexistent.block");
    expect(nonExistent).toBeUndefined();
  });
});
