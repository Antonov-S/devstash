/**
 * Shared result shape for server actions that return data on success. Actions
 * that return something other than `data` on success (e.g. `{ isFavorite }`) or
 * nothing at all (`{ success: true }`) intentionally keep their own union and
 * should NOT be forced onto this type.
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Structural shape of a Zod error's `.issues` — avoids importing ZodError so a
// schema validated through any Zod version slots in (matches the structural
// approach in `run-ai-action.ts`'s `Parseable`).
interface IssueContainer {
  issues: Array<{ message?: string }>;
}

/**
 * Pull the first validation message off a failed `safeParse`, falling back to a
 * generic string. Centralizes the `error.issues[0]?.message ?? "…"` extraction
 * that every action repeated — it does NOT change any message text.
 */
export function firstIssue(
  error: IssueContainer,
  fallback = "Invalid input"
): string {
  return error.issues[0]?.message ?? fallback;
}
