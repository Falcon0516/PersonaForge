import { BlockDef } from "./types.js";
import { CategoryId, PromptSectionId, PROMPT_SECTIONS, CATEGORIES } from "../schemas/sections.js";
import { identityBlocks } from "./categories/identity.js";
import { personalityBlocks } from "./categories/personality.js";
import { toneBlocks } from "./categories/tone.js";
import { industryBlocks } from "./categories/industry.js";
import { businessBlocks } from "./categories/business.js";
import { knowledgeBlocks } from "./categories/knowledge.js";
import { behaviourBlocks } from "./categories/behaviour.js";
import { languageBlocks } from "./categories/language.js";
import { outputBlocks } from "./categories/output.js";
import { guardrailBlocks } from "./categories/guardrails.js";
import { actionBlocks } from "./categories/actions.js";
import { conversationBlocks } from "./categories/conversation.js";
import { voiceBlocks } from "./categories/voice.js";
import { modelBlocks } from "./categories/model.js";
import { channelOverrideBlocks } from "./categories/channel_overrides.js";

const ALL_CATEGORY_BLOCKS = [
  ...identityBlocks,
  ...personalityBlocks,
  ...toneBlocks,
  ...industryBlocks,
  ...businessBlocks,
  ...knowledgeBlocks,
  ...behaviourBlocks,
  ...languageBlocks,
  ...outputBlocks,
  ...guardrailBlocks,
  ...actionBlocks,
  ...conversationBlocks,
  ...voiceBlocks,
  ...modelBlocks,
  ...channelOverrideBlocks,
];

class BlockRegistry {
  private blocks = new Map<string, BlockDef<any>>();

  register<V>(block: BlockDef<V>): void {
    if (this.blocks.has(block.id)) {
      throw new Error(`Duplicate block ID registered: "${block.id}"`);
    }
    this.blocks.set(block.id, block);
  }

  get<V = unknown>(id: string): BlockDef<V> | undefined {
    return this.blocks.get(id) as BlockDef<V> | undefined;
  }

  getAll(): BlockDef<any>[] {
    return Array.from(this.blocks.values());
  }

  getByCategory(category: CategoryId): BlockDef<any>[] {
    return this.getAll().filter((b) => b.category === category);
  }

  getBySection(section: PromptSectionId): BlockDef<any>[] {
    return this.getAll().filter((b) => b.section === section);
  }

  clear(): void {
    this.blocks.clear();
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validSections = new Set<string>(PROMPT_SECTIONS);
    const validCategories = new Set<string>(CATEGORIES);

    for (const block of this.blocks.values()) {
      if (!validCategories.has(block.category)) {
        errors.push(`Block "${block.id}" has invalid category "${block.category}".`);
      }
      if (!validSections.has(block.section)) {
        errors.push(`Block "${block.id}" has invalid section "${block.section}".`);
      }
      const schemaCheck = block.schema.safeParse(block.default);
      if (!schemaCheck.success) {
        errors.push(
          `Block "${block.id}" default value failed its own schema validation: ${schemaCheck.error.message}`
        );
      }
      if (typeof block.priority !== "number" || isNaN(block.priority)) {
        errors.push(`Block "${block.id}" has non-numeric priority.`);
      }
      if (block.requires) {
        for (const req of block.requires) {
          if (!this.blocks.has(req)) {
            errors.push(`Block "${block.id}" requires nonexistent block "${req}".`);
          }
        }
      }
      if (block.conflicts) {
        for (const conf of block.conflicts) {
          if (!this.blocks.has(conf.with)) {
            errors.push(`Block "${block.id}" defines conflict with nonexistent block "${conf.with}".`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const registry = new BlockRegistry();

for (const b of ALL_CATEGORY_BLOCKS) {
  try {
    registry.register(b);
  } catch {
    // Ignore in hot-reload
  }
}

export function registerBlock<V>(block: BlockDef<V>): BlockDef<V> {
  registry.register(block);
  return block;
}

export function getBlock<V = unknown>(id: string): BlockDef<V> | undefined {
  return registry.get<V>(id);
}

export function getAllBlocks(): BlockDef<any>[] {
  return registry.getAll();
}

export function validateRegistry(): { valid: boolean; errors: string[] } {
  return registry.validate();
}
