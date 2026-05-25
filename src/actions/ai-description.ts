"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { getUserIsPro } from "@/lib/billing";
import { AI_MAX_INPUT_CHARS } from "@/lib/constants";
import { AI_MODEL, getOpenAI } from "@/lib/openai";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";

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

function truncate(value: string): string {
  if (value.length <= AI_MAX_INPUT_CHARS) return value;
  return value.slice(0, AI_MAX_INPUT_CHARS) + "\n…[truncated]";
}

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

// The model is asked for JSON but may return `{"description": "..."}` OR a
// bare string `"…"` — handle both shapes and bail out cleanly if neither.
function parseDescriptionResponse(text: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed === "string") {
    const normalized = normalizeDescription(parsed);
    return normalized || null;
  }
  if (parsed && typeof parsed === "object" && "description" in parsed) {
    const raw = (parsed as { description: unknown }).description;
    if (typeof raw !== "string") return null;
    const normalized = normalizeDescription(raw);
    return normalized || null;
  }
  return null;
}

export async function generateDescription(
  payload: GenerateDescriptionPayload
): Promise<GenerateDescriptionResult> {
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

  const limit = await rateLimit(
    "aiGenerateDescription",
    `user:${session.user.id}`
  );
  if (!limit.success) {
    return { success: false, error: rateLimitMessage(limit) };
  }

  const parsed = inputSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Invalid input" };
  }

  const { title, content, url, language, fileName, tags, typeName } =
    parsed.data;

  // The Responses API requires the literal word "json" to appear in `input`
  // when `text.format` is `json_object` — it does not scan `instructions` for it.
  const tagsLine = tags.length > 0 ? `Tags: ${tags.join(", ")}` : null;
  const input = truncate(
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
      return { success: false, error: "AI did not return a description." };
    }

    const description = parseDescriptionResponse(text);
    if (!description) {
      return { success: false, error: "AI did not return a description." };
    }

    return { success: true, description };
  } catch (error) {
    console.error("generateDescription failed", error);
    return {
      success: false,
      error: "Could not generate description. Please try again."
    };
  }
}
