import { z } from "zod";
import { BotMode, Channel } from "../schemas/channels.js";
import { CategoryId, CompileContext, Patch, PromptSectionId } from "../schemas/sections.js";

export type BlockKind =
  | "select"
  | "multiselect"
  | "slider"
  | "toggle"
  | "text"
  | "textarea"
  | "list"
  | "keyvalue"
  | "faq"
  | "file"
  | "color";

export interface ConflictRule<V = unknown> {
  with: string;
  when?: (a: V, b: unknown) => boolean;
  message: string;
  fix?: Patch;
}

export interface BlockDef<V = unknown> {
  id: string;
  category: CategoryId;
  section: PromptSectionId;
  label: string;
  description: string;
  icon: string;
  kind: BlockKind;
  schema: z.ZodType<V>;
  default: V;
  options?: { value: string; label: string; hint?: string }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  modes: BotMode[];
  channels: Channel[];
  industries?: string[];
  priority: number;
  render: (value: V, ctx: CompileContext) => string | null;
  conflicts?: ConflictRule<V>[];
  requires?: string[];
}

export type BlockDefinition<V = unknown> = BlockDef<V>;
export type BlockCategory = CategoryId;

