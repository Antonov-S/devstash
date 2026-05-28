"use server";

import { z } from "zod";

import {
  extractJsonField,
  runAiAction,
  truncate
} from "@/lib/ai/run-ai-action";

const SYSTEM_INSTRUCTIONS = `You are a prompt-refinement assistant for a developer knowledge hub.
Given a user-saved prompt intended for use with an LLM, rewrite it so it is clearer, more
specific, and more likely to produce a useful response. Preserve the user's intent exactly —
do not change what the prompt is asking for, only how it asks. Keep the same overall length
unless the original is genuinely under- or over-specified. Markdown is allowed. Do not add
preamble or commentary. If the prompt is already excellent, return it unchanged.
Respond ONLY with valid JSON. Use either {"prompt": "…refined prompt…"} or just "…refined prompt…".`;

const inputSchema = z.object({
  typeName: z.literal("prompt"),
  title: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => (value == null ? "" : value.trim())),
  content: z
    .string()
    .min(1, "There's nothing to optimize.")
    .transform((value) => value)
});

export type OptimizePromptPayload = z.input<typeof inputSchema>;

export type OptimizePromptResult =
  | { success: true; prompt: string }
  | { success: false; error: string };

export async function optimizePrompt(
  payload: OptimizePromptPayload
): Promise<OptimizePromptResult> {
  const result = await runAiAction<z.infer<typeof inputSchema>, string>({
    name: "optimizePrompt",
    payload,
    schema: inputSchema,
    limiterName: "aiOptimizePrompt",
    instructions: SYSTEM_INSTRUCTIONS,
    // The Responses API requires the literal word "json" to appear in `input`
    // when `text.format` is `json_object` — it does not scan `instructions`.
    buildInput: ({ title, content }) =>
      truncate(
        [
          "Refine the prompt below and respond as JSON.",
          title ? `Title: ${title}` : null,
          `Prompt:\n${content}`
        ]
          .filter(Boolean)
          .join("\n")
      ),
    parse: (text) => {
      const value = extractJsonField(text, "prompt");
      return typeof value === "string" ? value.trim() || null : null;
    },
    errors: {
      empty: "AI did not return a refined prompt.",
      failure: "Could not optimize this prompt. Please try again."
    }
  });

  if (!result.success) return result;
  return { success: true, prompt: result.data };
}
