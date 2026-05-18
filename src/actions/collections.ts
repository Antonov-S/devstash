"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createCollectionForUser,
  type CollectionWithMeta
} from "@/lib/db/collections";

function normalizeOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

const optionalTrimmedString = z
  .union([z.string(), z.null()])
  .optional()
  .transform(normalizeOptional);

const createCollectionSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: "Name is required" }),
  description: optionalTrimmedString
});

export type CreateCollectionPayload = z.input<typeof createCollectionSchema>;

export type CreateCollectionResult =
  | { success: true; data: CollectionWithMeta }
  | { success: false; error: string };

export async function createCollectionAction(
  payload: CreateCollectionPayload
): Promise<CreateCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You are not signed in." };
  }

  const parsed = createCollectionSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false,
      error: first?.message ?? "Invalid input"
    };
  }

  try {
    const created = await createCollectionForUser(session.user.id, parsed.data);
    return { success: true, data: created };
  } catch (error) {
    console.error("createCollectionAction failed", error);
    return {
      success: false,
      error: "Could not create collection. Please try again."
    };
  }
}
