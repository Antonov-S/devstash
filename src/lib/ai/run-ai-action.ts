import "server-only";

import { requireUserId } from "@/lib/actions/require-user";
import { firstIssue, type ActionResult } from "@/lib/actions/result";
import { getUserIsPro } from "@/lib/billing";
import { AI_MAX_INPUT_CHARS } from "@/lib/constants";
import { AI_MODEL, getOpenAI } from "@/lib/openai";
import {
  rateLimit,
  rateLimitMessage,
  type LimiterName
} from "@/lib/rate-limit";

export type AiActionResult<T> = ActionResult<T>;

/** Cap the model input so a huge item can't blow past token limits. */
export function truncate(value: string): string {
  if (value.length <= AI_MAX_INPUT_CHARS) return value;
  return value.slice(0, AI_MAX_INPUT_CHARS) + "\n…[truncated]";
}

/**
 * Pull a field out of the model's JSON output, tolerating both shapes the
 * model returns: `{"<key>": <value>}` OR a bare top-level `<value>`
 * (e.g. `["a", "b"]` or `"…"`). Returns `undefined` on invalid JSON so callers
 * can treat it the same as a missing field.
 */
export function extractJsonField(text: string, key: string): unknown {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (
    parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    key in parsed
  ) {
    return (parsed as Record<string, unknown>)[key];
  }
  return parsed;
}

// Structural shape of a Zod schema's `.safeParse` — avoids coupling to Zod's
// exact generic arity so any `z.object`/`.superRefine` schema slots in.
interface Parseable<T> {
  safeParse(payload: unknown):
    | { success: true; data: T }
    | { success: false; error: { issues: Array<{ message?: string }> } };
}

export interface RunAiActionConfig<TParsed, TData> {
  /** Used only as the console.error label when the OpenAI call throws. */
  name: string;
  payload: unknown;
  schema: Parseable<TParsed>;
  limiterName: LimiterName;
  instructions: string;
  /** Build the model input string from the validated payload. */
  buildInput: (data: TParsed) => string;
  /** Parse the model's text output; return null to signal "no usable result". */
  parse: (text: string) => TData | null;
  errors: {
    /** Returned for both an empty model response and a failed parse. */
    empty: string;
    /** Returned when the OpenAI call throws. */
    failure: string;
  };
}

/**
 * Shared pipeline for the AI server actions. Owns the auth → Pro → rate-limit →
 * validate → OpenAI → parse sequence that was duplicated across every AI action.
 * Each action supplies only its schema, prompt assembly, parse callback, limiter
 * name, and error strings. The ordering here is load-bearing — the action test
 * suites assert that the Pro check runs before the rate-limit check, which runs
 * before validation, which runs before the model call.
 */
export async function runAiAction<TParsed, TData>(
  config: RunAiActionConfig<TParsed, TData>
): Promise<AiActionResult<TData>> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }
  const { userId } = authed;

  // Always re-read isPro from the DB, never session.user.isPro — the JWT can
  // carry a stale value across a Stripe downgrade until the next refresh.
  const isPro = await getUserIsPro(userId);
  if (!isPro) {
    return { success: false, error: "AI features require Pro." };
  }

  const limit = await rateLimit(config.limiterName, `user:${userId}`);
  if (!limit.success) {
    return { success: false, error: rateLimitMessage(limit) };
  }

  const parsed = config.schema.safeParse(config.payload);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }

  const input = config.buildInput(parsed.data);

  try {
    // gpt-5-nano REQUIRES the Responses API. Chat Completions returns empty
    // content for this model; zodResponseFormat hits length limits. Use plain
    // json_object format and parse manually.
    const response = await getOpenAI().responses.create({
      model: AI_MODEL,
      instructions: config.instructions,
      input,
      text: { format: { type: "json_object" } }
    });

    const text = response.output_text?.trim() ?? "";
    if (!text) {
      return { success: false, error: config.errors.empty };
    }

    const data = config.parse(text);
    if (data == null) {
      return { success: false, error: config.errors.empty };
    }

    return { success: true, data };
  } catch (error) {
    console.error(`${config.name} failed`, error);
    return { success: false, error: config.errors.failure };
  }
}
