import { describe, it, expect } from "vitest";
import { ALL_TEMPLATES, getAllTemplates, getTemplateBySlug, getTemplateById } from "./index.js";
import { compile } from "../compiler/compiler.js";
import { scorePrompt } from "../scoring/scorer.js";
import { detectConflicts } from "../conflicts/conflicts.js";

describe("Industry Templates & Snapshot Tests", () => {
  it("contains all 12 shipped industry templates", () => {
    const templates = getAllTemplates();
    expect(templates).toHaveLength(12);

    const slugs = templates.map((t) => t.slug);
    expect(slugs).toContain("kisan-mitra");
    expect(slugs).toContain("ecommerce-concierge");
    expect(slugs).toContain("saas-support");
    expect(slugs).toContain("tech-helpdesk");
    expect(slugs).toContain("clinic-intake");
    expect(slugs).toContain("finance-faq");
    expect(slugs).toContain("socratic-tutor");
    expect(slugs).toContain("hr-navigator");
    expect(slugs).toContain("travel-planner");
    expect(slugs).toContain("real-estate-finder");
    expect(slugs).toContain("citizen-services");
    expect(slugs).toContain("astronavigator");
  });

  it("can lookup template by slug and by id", () => {
    const kisan = getTemplateBySlug("kisan-mitra");
    expect(kisan).toBeDefined();
    expect(kisan?.name).toContain("KisanMitra");

    const byId = getTemplateById("00000000-0000-4000-8000-000000000001");
    expect(byId?.slug).toBe("kisan-mitra");
  });

  // Snapshot tests for all 12 templates
  for (const template of ALL_TEMPLATES) {
    it(`compiles ${template.name} cleanly and deterministically with high quality score`, () => {
      // 1. Conflict check
      const conflicts = detectConflicts(template.config);
      expect(conflicts).toHaveLength(0);

      // 2. Score check
      const score = scorePrompt(template.config);
      expect(score.score).toBeGreaterThanOrEqual(80);

      // 3. Compile output
      const compiledWeb = compile(template.config, { channel: "web" });
      expect(compiledWeb.prompt.length).toBeGreaterThan(100);
      expect(compiledWeb.warnings).toHaveLength(0);

      // 4. Matches snapshot
      expect(compiledWeb.prompt).toMatchSnapshot();
    });
  }

  it("specifically validates KisanMitra prompt rules in the Agriculture template", () => {
    const kisan = getTemplateBySlug("kisan-mitra")!;
    const whatsappCompiled = compile(kisan.config, { channel: "whatsapp" });

    // Assert KisanMitra rules are present
    expect(whatsappCompiled.prompt).toContain("KisanMitra");
    expect(whatsappCompiled.prompt).toContain("Direct-to-Consumer Fresh Produce Marketplace");
    expect(whatsappCompiled.prompt).toContain("SHORT and SIMPLE");
    expect(whatsappCompiled.prompt).toContain("WHATSAPP LENGTH BUDGET");
    expect(whatsappCompiled.prompt.toLowerCase()).toContain("anna");
    expect(whatsappCompiled.prompt.toLowerCase()).toContain("bhai");
  });
});
