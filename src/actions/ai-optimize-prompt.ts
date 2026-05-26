"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { getUserIsPro } from "@/lib/billing";
import { AI_MAX_INPUT_CHARS } from "@/lib/constants";
import { AI_MODEL, getOpenAI } from "@/lib/openai";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";

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

function truncate(value: string): string {
  if (value.length <= AI_MAX_INPUT_CHARS) return value;
  return value.slice(0, AI_MAX_INPUT_CHARS) + "\n…[truncated]";
}

// The model is asked for JSON but may return `{"prompt": "..."}` OR a bare
// string `"…"` — handle both shapes and bail out cleanly if neither.
function parseOptimizedResponse(text: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed === "string") {
    const trimmed = parsed.trim();
    return trimmed || null;
  }
  if (parsed && typeof parsed === "object" && "prompt" in parsed) {
    const raw = (parsed as { prompt: unknown }).prompt;
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    return trimmed || null;
  }
  return null;
}

export async function optimizePrompt(
  payload: OptimizePromptPayload
): Promise<OptimizePromptResult> {
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

  const limit = await rateLimit("aiOptimizePrompt", `user:${session.user.id}`);
  if (!limit.success) {
    return { success: false, error: rateLimitMessage(limit) };
  }

  const parsed = inputSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Invalid input" };
  }

  const { title, content } = parsed.data;

  // The Responses API requires the literal word "json" to appear in `input`
  // when `text.format` is `json_object` — it does not scan `instructions` for it.
  const input = truncate(
    [
      "Refine the prompt below and respond as JSON.",
      title ? `Title: ${title}` : null,
      `Prompt:\n${content}`
    ]
      .filter(Boolean)
      .join("\n")
  );

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
      return { success: false, error: "AI did not return a refined prompt." };
    }

    const prompt = parseOptimizedResponse(text);
    if (!prompt) {
      return { success: false, error: "AI did not return a refined prompt." };
    }

    return { success: true, prompt };
  } catch (error) {
    console.error("optimizePrompt failed", error);
    return {
      success: false,
      error: "Could not optimize this prompt. Please try again."
    };
  }
}
