import { BotConfig } from "../schemas/bot.js";

export interface TemplatePreset {
  id: string;
  slug: string;
  name: string;
  industry: string;
  description: string;
  suggestedChips: string[];
  conversationStarters: string[];
  config: BotConfig;
}
