import { z } from "zod";

export const aiMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4_000),
});

export const aiChatRequestSchema = z.object({ messages: z.array(aiMessageSchema).min(1).max(12) });

export interface AiChatRequest {
  readonly messages: readonly { readonly role: "user" | "assistant"; readonly content: string }[];
}
