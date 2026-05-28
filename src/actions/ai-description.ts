"use server";

import { z } from "zod";

import {
  extractJsonField,
  runAiAction,
  truncate
} from "@/lib/ai/run-ai-action";

const SYSTEM_INSTRUCTIONS = `You are a description-writing assistant for a developer knowledge hub.
Given the user's item, write a single concise description of 1-2 sentences.
The description should explain what the item is and why someone would save it.
Keep it factual, neutral, and free of marketing language. Do not exceed 2 sentences.
NEVER include emails, tokens, secrets, or other sensitive data in the description.
Respond ONLY with valid JSON. Use either {"description": "…"} or just "…".`;

const inputSchema = z
  .object({
    typeName: z.string(),
    title: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => (value == null ? "" : value.trim())),
    content: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => (value == null ? "" : value)),
    url: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => (value == null ? "" : value.trim())),
    language: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => (value == null ? "" : value)),
    fileName: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => (value == null ? "" : value.trim())),
    tags: z
      .union([z.array(z.string()), z.null()])
      .optional()
      .transform((value) => (value == null ? [] : value))
  })
  .superRefine((value, ctx) => {
    if (!value.title && !value.content && !value.url && !value.fileName) {
      ctx.addIssue({
        code: "custom",
        message: "Need a title, content, URL, or filename to work from."
      });
    }
  });

export type GenerateDescriptionPayload = z.input<typeof inputSchema>;

export type GenerateDescriptionResult =
  | { success: true; description: string }
  | { success: false; error: string };

function normalizeDescription(value: string): string {
  // Collapse whitespace runs (including newlines) to a single space.
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  // Cap to the first 2 sentences in case the model overshoots. Splits on
  // .!? followed by whitespace; keeps the punctuation via the captured group.
  const parts = collapsed.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
  if (!parts || parts.length === 0) return collapsed;
  return parts
    .slice(0, 2)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

export async function generateDescription(
  payload: GenerateDescriptionPayload
): Promise<GenerateDescriptionResult> {
  const result = await runAiAction<z.infer<typeof inputSchema>, string>({
    name: "generateDescription",
    payload,
    schema: inputSchema,
    limiterName: "aiGenerateDescription",
    instructions: SYSTEM_INSTRUCTIONS,
    // The Responses API requires the literal word "json" to appear in `input`
    // when `text.format` is `json_object` — it does not scan `instructions`.
    buildInput: ({ title, content, url, language, fileName, tags, typeName }) => {
      const tagsLine = tags.length > 0 ? `Tags: ${tags.join(", ")}` : null;
      return truncate(
        [
          "Write a description as JSON for the item below.",
          `Type: ${typeName}`,
          language ? `Language: ${language}` : null,
          title ? `Title: ${title}` : null,
          url ? `URL: ${url}` : null,
          fileName ? `Filename: ${fileName}` : null,
          tagsLine,
          content ? `Content:\n${content}` : null
        ]
          .filter(Boolean)
          .join("\n")
      );
    },
    parse: (text) => {
      const value = extractJsonField(text, "description");
      if (typeof value !== "string") return null;
      return normalizeDescription(value) || null;
    },
    errors: {
      empty: "AI did not return a description.",
      failure: "Could not generate description. Please try again."
    }
  });

  if (!result.success) return result;
  return { success: true, description: result.data };
}
