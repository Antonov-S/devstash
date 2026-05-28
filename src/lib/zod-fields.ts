import { z } from "zod";

/**
 * Shared Zod field builders for server-action input schemas.
 *
 * These were previously duplicated verbatim across `src/actions/items.ts` and
 * `src/actions/collections.ts`. Keep them here (not in `constants.ts`) since
 * they are schema builders, not tunable constant values.
 */

export function normalizeOptional(
  value: string | null | undefined
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export const optionalTrimmedString = z
  .union([z.string(), z.null()])
  .optional()
  .transform(normalizeOptional);

export const urlField = z
  .union([z.string(), z.null()])
  .optional()
  .transform(normalizeOptional)
  .refine(
    (value) => {
      if (value === null) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid URL" }
  );

export const collectionIdsField = z
  .array(z.string())
  .optional()
  .transform((ids) =>
    (ids ?? []).map((id) => id.trim()).filter((id) => id.length > 0)
  );
