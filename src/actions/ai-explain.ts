"use server";

import { z } from "zod";

import {
  extractJsonField,
  runAiAction,
  truncate
} from "@/lib/ai/run-ai-action";

const SYSTEM_INSTRUCTIONS = `You are a code-explanation assistant for a developer knowledge hub.
Given a code snippet or terminal command, write a clear, plain-English explanation in markdown.
Aim for 200-300 words. Cover what the code does and the key concepts a reader should know.
Use short paragraphs, inline code for identifiers, and fenced code blocks only if you need to
contrast variants. Do not invent behavior the snippet doesn't show. Do not include emails,
tokens, secrets, or any sensitive data you may see in the input.
Respond ONLY with valid JSON. Use either {"explanation": "…markdown…"} or just "…markdown…".`;

const inputSchema = z.object({
  typeName: z.enum(["snippet", "command"]),
  title: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => (value == null ? "" : value.trim())),
  content: z
    .string()
    .min(1, "There's no code to explain.")
    .transform((value) => value),
  language: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => (value == null ? "" : value.trim()))
});

export type ExplainCodePayload = z.input<typeof inputSchema>;

export type ExplainCodeResult =
  | { success: true; explanation: string }
  | { success: false; error: string };

export async function explainCode(
  payload: ExplainCodePayload
): Promise<ExplainCodeResult> {
  const result = await runAiAction<z.infer<typeof inputSchema>, string>({
    name: "explainCode",
    payload,
    schema: inputSchema,
    limiterName: "aiExplainCode",
    instructions: SYSTEM_INSTRUCTIONS,
    // The Responses API requires the literal word "json" to appear in `input`
    // when `text.format` is `json_object` — it does not scan `instructions`.
    buildInput: ({ title, content, language, typeName }) =>
      truncate(
        [
          "Explain the code below as JSON.",
          `Type: ${typeName}`,
          language ? `Language: ${language}` : null,
          title ? `Title: ${title}` : null,
          `Content:\n${content}`
        ]
          .filter(Boolean)
          .join("\n")
      ),
    parse: (text) => {
      const value = extractJsonField(text, "explanation");
      return typeof value === "string" ? value.trim() || null : null;
    },
    errors: {
      empty: "AI did not return an explanation.",
      failure: "Could not explain this code. Please try again."
    }
  });

  if (!result.success) return result;
  return { success: true, explanation: result.data };
}
