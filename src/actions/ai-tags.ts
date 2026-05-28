"use server";

import { z } from "zod";

import {
  extractJsonField,
  runAiAction,
  truncate
} from "@/lib/ai/run-ai-action";

const SYSTEM_INSTRUCTIONS = `You are a tagging assistant for a developer knowledge hub.
Given the user's content, suggest 3-5 short, lowercase tags useful for filtering.
Tags should be 1-3 words each, specific, and relevant to the content.
NEVER include emails, tokens, secrets, or other sensitive data in tags.
Respond ONLY with valid JSON. Use either {"tags": ["a", "b"]} or just ["a", "b"].`;

const inputSchema = z.object({
  title: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: "Title is required" })
    .refine((value) => value.length <= 200, {
      message: "Title is too long"
    }),
  content: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => (value == null ? "" : value)),
  description: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => (value == null ? "" : value)),
  language: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => (value == null ? "" : value)),
  typeName: z.string()
});

export type GenerateAutoTagsPayload = z.input<typeof inputSchema>;

export type GenerateAutoTagsResult =
  | { success: true; tags: string[] }
  | { success: false; error: string };

function normalizeTags(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    if (typeof raw !== "string") continue;
    const tag = raw.trim().toLowerCase();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag);
  }
  return result;
}

export async function generateAutoTags(
  payload: GenerateAutoTagsPayload
): Promise<GenerateAutoTagsResult> {
  const result = await runAiAction<z.infer<typeof inputSchema>, string[]>({
    name: "generateAutoTags",
    payload,
    schema: inputSchema,
    limiterName: "aiSuggestTags",
    instructions: SYSTEM_INSTRUCTIONS,
    // The Responses API requires the literal word "json" to appear in `input`
    // when `text.format` is `json_object` — it does not scan `instructions`.
    buildInput: ({ title, content, description, language, typeName }) =>
      [
        "Suggest tags as JSON for the item below.",
        `Type: ${typeName}`,
        language ? `Language: ${language}` : null,
        `Title: ${title}`,
        description ? `Description: ${description}` : null,
        content ? `Content:\n${truncate(content)}` : null
      ]
        .filter(Boolean)
        .join("\n"),
    parse: (text) => {
      const tags = normalizeTags(extractJsonField(text, "tags"));
      return tags.length > 0 ? tags : null;
    },
    errors: {
      empty: "AI did not return any tags.",
      failure: "Could not suggest tags. Please try again."
    }
  });

  if (!result.success) return result;
  return { success: true, tags: result.data };
}
