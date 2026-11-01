import { BotConfig } from "../schemas/bot.js";
import { Channel } from "../schemas/channels.js";
import { CompileContext, PromptSectionId, PROMPT_SECTIONS } from "../schemas/sections.js";
import { getAllBlocks } from "../blocks/index.js";
import { estimateTokens } from "./tokens.js";

export interface CompileOptions {
  channel?: Channel;
  runtime?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  maxTokenBudget?: number;
}

export interface DroppedFragment {
  blockId: string;
  priority: number;
  reason: string;
}

export interface CompiledOutput {
  prompt: string;
  sections: Record<PromptSectionId, string>;
  trace: Record<number, string>; // lineNumber (1-indexed) -> blockId or special identifier
  tokenEstimate: number;
  warnings: string[];
  droppedBlocks: DroppedFragment[];
}

const SECTION_HEADERS: Record<PromptSectionId, string> = {
  identity: "## 1. Identity & Role",
  business_context: "## 2. Business Context & Offerings",
  personality_and_tone: "## 3. Personality, Tone & Style",
  language: "## 4. Language & Localization",
  knowledge_rules: "## 5. Knowledge & Grounding Rules",
  behaviour: "## 6. Behaviour & Interaction Protocols",
  output_format: "## 7. Output Format & Constraints",
  guardrails: "## 8. Rules & Safety Guardrails",
  actions: "## 9. Actions & Integrations",
  examples: "## 10. Examples & Few-Shot Dialogue",
  runtime_context: "## 11. Runtime Context",
};

interface RenderedFragment {
  blockId: string;
  section: PromptSectionId;
  priority: number;
  content: string;
}

export function compile(config: BotConfig, options: CompileOptions = {}): CompiledOutput {
  const channel: Channel = options.channel || "web";
  const warnings: string[] = [];
  const droppedBlocks: DroppedFragment[] = [];
  const sectionsContent: Record<PromptSectionId, string> = {
    identity: "",
    business_context: "",
    personality_and_tone: "",
    language: "",
    knowledge_rules: "",
    behaviour: "",
    output_format: "",
    guardrails: "",
    actions: "",
    examples: "",
    runtime_context: "",
  };

  // 1. Check for expert.replace full override
  if (config.expert?.replace && config.expert.replace.trim().length > 0) {
    warnings.push("Compiler bypassed: full override active via expert.replace.");
    const rawPrompt = config.expert.replace.trim();
    const trace: Record<number, string> = {};
    const lines = rawPrompt.split("\n");
    for (let i = 0; i < lines.length; i++) {
      trace[i + 1] = "expert.replace";
    }

    return {
      prompt: rawPrompt,
      sections: sectionsContent,
      trace,
      tokenEstimate: estimateTokens(rawPrompt),
      warnings,
      droppedBlocks: [],
    };
  }

  const ctx: CompileContext = {
    channel,
    mode: config.mode,
    botName: config.name,
    industry: config.industry,
    runtime: {
      model: options.runtime?.model || config.runtime?.model,
      temperature: options.runtime?.temperature ?? config.runtime?.temperature,
      maxTokens: options.runtime?.maxTokens ?? config.runtime?.maxTokens,
    },
  };

  // 2. Gather candidate blocks from registry
  const allBlocks = getAllBlocks();
  const fragmentsBySection: Record<PromptSectionId, RenderedFragment[]> = {
    identity: [],
    business_context: [],
    personality_and_tone: [],
    language: [],
    knowledge_rules: [],
    behaviour: [],
    output_format: [],
    guardrails: [],
    actions: [],
    examples: [],
    runtime_context: [],
  };

  for (const block of allBlocks) {
    // Mode compatibility check
    if (!block.modes.includes(config.mode)) {
      continue;
    }

    // Channel compatibility check
    if (!block.channels.includes(channel)) {
      continue;
    }

    // Value lookup: config.blocks[id] ?? block.default
    const userVal = config.blocks?.[block.id];
    const val = userVal !== undefined ? userVal : block.default;

    try {
      const fragment = block.render(val, ctx);
      if (fragment && fragment.trim().length > 0) {
        fragmentsBySection[block.section].push({
          blockId: block.id,
          section: block.section,
          priority: block.priority,
          content: fragment.trim(),
        });
      }
    } catch (err: any) {
      warnings.push(`Render error in block "${block.id}": ${err?.message || "Unknown error"}`);
    }
  }

  // 3. Sort fragments within each section
  for (const sectionId of PROMPT_SECTIONS) {
    const sectionFrags = fragmentsBySection[sectionId];
    if (config.blockOrder && config.blockOrder.length > 0) {
      const orderMap = new Map(config.blockOrder.map((id, index) => [id, index]));
      sectionFrags.sort((a, b) => {
        const orderA = orderMap.has(a.blockId) ? orderMap.get(a.blockId)! : 1000 - a.priority;
        const orderB = orderMap.has(b.blockId) ? orderMap.get(b.blockId)! : 1000 - b.priority;
        return orderA - orderB;
      });
    } else {
      sectionFrags.sort((a, b) => b.priority - a.priority);
    }
  }

  // 4. Token estimation & Compaction Pass
  if (options.maxTokenBudget && options.maxTokenBudget > 100) {
    let currentFragments = Object.values(fragmentsBySection).flat();
    let samplePrompt = currentFragments.map((f) => f.content).join("\n\n");
    let estimate = estimateTokens(samplePrompt);

    if (estimate > options.maxTokenBudget) {
      // Sort all fragments by priority ascending (drop lowest priority first)
      const droppable = [...currentFragments].sort((a, b) => a.priority - b.priority);

      for (const candidate of droppable) {
        if (estimate <= options.maxTokenBudget) break;

        // Remove from section
        fragmentsBySection[candidate.section] = fragmentsBySection[candidate.section].filter(
          (f) => f.blockId !== candidate.blockId
        );
        droppedBlocks.push({
          blockId: candidate.blockId,
          priority: candidate.priority,
          reason: `Exceeded maxTokenBudget (${options.maxTokenBudget})`,
        });

        // Recalculate
        currentFragments = Object.values(fragmentsBySection).flat();
        samplePrompt = currentFragments.map((f) => f.content).join("\n\n");
        estimate = estimateTokens(samplePrompt);
      }

      if (droppedBlocks.length > 0) {
        warnings.push(`Compaction pass dropped ${droppedBlocks.length} low-priority fragments to fit budget.`);
      }
    }
  }

  // 5. Build prompt string with line-by-line trace
  const promptLines: string[] = [];
  const trace: Record<number, string> = {};

  function addLine(line: string, blockId: string) {
    promptLines.push(line);
    const lineNum = promptLines.length;
    trace[lineNum] = blockId;
  }

  addLine(`# SYSTEM PROMPT: ${config.name.toUpperCase()}`, "system.title");
  addLine("", "system.title");

  for (const sectionId of PROMPT_SECTIONS) {
    const frags = fragmentsBySection[sectionId];
    if (frags.length === 0) continue;

    const header = SECTION_HEADERS[sectionId];
    addLine(header, `section.${sectionId}`);
    addLine("", `section.${sectionId}`);

    const sectionTextParts: string[] = [];

    for (let fIdx = 0; fIdx < frags.length; fIdx++) {
      const frag = frags[fIdx]!;
      const fragLines = frag.content.split("\n");
      for (const line of fragLines) {
        addLine(line, frag.blockId);
      }
      sectionTextParts.push(frag.content);

      if (fIdx < frags.length - 1) {
        addLine("", frag.blockId);
      }
    }

    sectionsContent[sectionId] = sectionTextParts.join("\n\n");
    addLine("", `section.${sectionId}`);
  }

  // 6. Append expert additions if present
  if (config.expert?.append && config.expert.append.trim().length > 0) {
    addLine("## 12. Expert Additions", "expert.append");
    addLine("", "expert.append");
    const appendLines = config.expert.append.trim().split("\n");
    for (const line of appendLines) {
      addLine(line, "expert.append");
    }
  }

  // Strip trailing empty lines from promptLines and trace
  while (promptLines.length > 0 && promptLines[promptLines.length - 1] === "") {
    const lastNum = promptLines.length;
    delete trace[lastNum];
    promptLines.pop();
  }

  const finalPrompt = promptLines.join("\n");
  const tokenEstimate = estimateTokens(finalPrompt);

  return {
    prompt: finalPrompt,
    sections: sectionsContent,
    trace,
    tokenEstimate,
    warnings,
    droppedBlocks,
  };
}

export function compilePrompt(
  config: BotConfig,
  channel: Channel = "web",
  options: CompileOptions = {}
): CompiledOutput {
  return compile(config, { channel, ...options });
}

