import { BotConfig } from "../schemas/bot.js";
import { Conflict } from "../schemas/sections.js";
import { getBlock, getAllBlocks } from "../blocks/index.js";

export function detectConflicts(config: BotConfig): Conflict[] {
  const conflicts: Conflict[] = [];
  const seenPairKeys = new Set<string>();

  function addConflict(conflict: Conflict) {
    const pairKey = [conflict.blockA, conflict.blockB].sort().join("::");
    if (!seenPairKeys.has(pairKey)) {
      seenPairKeys.add(pairKey);
      conflicts.push(conflict);
    }
  }

  // 1. Structural rule: Voice bot with Markdown formatting enabled
  if (config.mode === "voice") {
    const mdVal = config.blocks?.["output.markdown"] !== undefined ? config.blocks["output.markdown"] : true;
    if (Boolean(mdVal)) {
      addConflict({
        id: "voice-mode-markdown",
        blockA: "output.markdown",
        blockB: "voice.spoken_style",
        message: "Voice bot mode active with rich markdown enabled. Spoken synthesis requires plain spoken phrasing.",
        fix: { blockId: "output.markdown", value: false, action: "set" },
      });
    }
  }

  // 2. Structural rule: Strict Knowledge Grounding without Knowledge Content
  const strictVal = config.blocks?.["knowledge.strict_grounding"];
  const textVal = config.blocks?.["knowledge.text"];
  const faqVal = config.blocks?.["knowledge.faq"];
  const hasKnowledge =
    (typeof textVal === "string" && textVal.trim().length > 0) ||
    (Array.isArray(faqVal) && faqVal.length > 0);

  if (Boolean(strictVal) && !hasKnowledge) {
    addConflict({
      id: "strict-knowledge-empty",
      blockA: "knowledge.strict_grounding",
      blockB: "knowledge.text",
      message: "'Answer only from knowledge' is enabled, but no knowledge text or FAQs are provided.",
      fix: { blockId: "knowledge.strict_grounding", value: false, action: "set" },
    });
  }

  // 3. Structural rule: High formality with Gen-Z slang / preset
  const formality = (config.blocks?.["personality.formality"] as number | undefined) ?? 0.6;
  const slang = Boolean(config.blocks?.["tone.slang"]);
  const tonePreset = config.blocks?.["tone.preset"] as string | undefined;

  if (formality >= 0.7 && (slang || tonePreset === "gen_z")) {
    addConflict({
      id: "formality-slang-conflict",
      blockA: "personality.formality",
      blockB: slang ? "tone.slang" : "tone.preset",
      message: "High formality (>= 0.7) contradicts contemporary slang / Gen-Z phrasing.",
      fix: slang
        ? { blockId: "tone.slang", value: false, action: "set" }
        : { blockId: "personality.formality", value: 0.3, action: "set" },
    });
  }

  // 4. Structural rule: High empathy with sarcastic banter
  const empathy = (config.blocks?.["personality.empathy"] as number | undefined) ?? 0.8;
  const sarcasm = Boolean(config.blocks?.["personality.sarcasm"]);
  if (sarcasm && empathy >= 0.8) {
    addConflict({
      id: "empathy-sarcasm-conflict",
      blockA: "personality.sarcasm",
      blockB: "personality.empathy",
      message: "High empathy (>= 0.8) conflicts with sarcastic snark / banter.",
      fix: { blockId: "personality.sarcasm", value: false, action: "set" },
    });
  }

  // 5. Evaluate block definition conflict rules
  const allBlocks = getAllBlocks();
  for (const block of allBlocks) {
    if (!block.conflicts) continue;
    if (!block.modes.includes(config.mode)) continue;

    const valA = config.blocks?.[block.id] !== undefined ? config.blocks[block.id] : block.default;

    for (const rule of block.conflicts) {
      const otherBlock = getBlock(rule.with);
      if (!otherBlock) continue;
      if (!otherBlock.modes.includes(config.mode)) continue;

      const valB =
        config.blocks?.[otherBlock.id] !== undefined ? config.blocks[otherBlock.id] : otherBlock.default;

      let hasConflict = false;
      if (rule.when) {
        try {
          hasConflict = rule.when(valA, valB);
        } catch {
          hasConflict = false;
        }
      } else {
        hasConflict = Boolean(valA) && Boolean(valB);
      }

      if (hasConflict) {
        addConflict({
          id: `${block.id}::${rule.with}`,
          blockA: block.id,
          blockB: rule.with,
          message: rule.message,
          fix: rule.fix,
        });
      }
    }
  }

  return conflicts;
}
