import { z } from "zod";

export const Channel = z.enum(["web", "voice", "whatsapp"]);
export type Channel = z.infer<typeof Channel>;

export const BotMode = z.enum(["chat", "voice"]);
export type BotMode = z.infer<typeof BotMode>;
