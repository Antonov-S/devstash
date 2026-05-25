"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { getUserIsPro } from "@/lib/billing";
import { AI_MAX_INPUT_CHARS } from "@/lib/constants";
import { AI_MODEL, getOpenAI } from "@/lib/openai";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";

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

function truncate(value: string): string {
  if (value.length <= AI_MAX_INPUT_CHARS) return value;
  return value.slice(0, AI_MAX_INPUT_CHARS) + "\n…[truncated]";
}

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

// The model is asked for JSON but may return `{"tags": [...]}` OR a bare
// `["a", "b"]` array — handle both shapes and bail out cleanly if neither.
function parseTagsResponse(text: string): string[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (Array.isArray(parsed)) return normalizeTags(parsed);
  if (parsed && typeof parsed === "object" && "tags" in parsed) {
    return normalizeTags((parsed as { tags: unknown }).tags);
  }
  return null;
}

export async function generateAutoTags(
  payload: GenerateAutoTagsPayload
): Promise<GenerateAutoTagsResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You are not signed in." };
  }

  // Always re-read isPro from the DB, never session.user.isPro — the JWT can
  // carry a stale value across a Stripe downgrade until the next refresh.
  const isPro = await getUserIsPro(session.user.id);
  if (!isPro) {
    return { success: false, error: "AI features require Pro." };
  }

  const limit = await rateLimit("aiSuggestTags", `user:${session.user.id}`);
  if (!limit.success) {
    return { success: false, error: rateLimitMessage(limit) };
  }

  const parsed = inputSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Invalid input" };
  }

  const { title, content, description, language, typeName } = parsed.data;
  // The Responses API requires the literal word "json" to appear in `input`
  // when `text.format` is `json_object` — it does not scan `instructions` for it.
  const input = [
    "Suggest tags as JSON for the item below.",
    `Type: ${typeName}`,
    language ? `Language: ${language}` : null,
    `Title: ${title}`,
    description ? `Description: ${description}` : null,
    content ? `Content:\n${truncate(content)}` : null
  ]
    .filter(Boolean)
    .join("\n");

  try {
    // gpt-5-nano REQUIRES the Responses API. Chat Completions returns empty
    // content for this model; zodResponseFormat hits length limits. Use plain
    // json_object format and parse manually.
    const response = await getOpenAI().responses.create({
      model: AI_MODEL,
      instructions: SYSTEM_INSTRUCTIONS,
      input,
      text: { format: { type: "json_object" } }
    });

    const text = response.output_text?.trim() ?? "";
    if (!text) {
      return { success: false, error: "AI did not return any tags." };
    }

    const tags = parseTagsResponse(text);
    if (!tags || tags.length === 0) {
      return { success: false, error: "AI did not return any tags." };
    }

    return { success: true, tags };
  } catch (error) {
    console.error("generateAutoTags failed", error);
    return {
      success: false,
      error: "Could not suggest tags. Please try again."
    };
  }
}
