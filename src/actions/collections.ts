"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createCollectionForUser,
  deleteCollectionForUser,
  updateCollectionForUser,
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

const updateCollectionSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: "Name is required" }),
  description: optionalTrimmedString
});

export type UpdateCollectionPayload = z.input<typeof updateCollectionSchema>;

export type UpdateCollectionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateCollectionAction(
  collectionId: string,
  payload: UpdateCollectionPayload
): Promise<UpdateCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You are not signed in." };
  }

  if (typeof collectionId !== "string" || !collectionId) {
    return { success: false, error: "Invalid collection id" };
  }

  const parsed = updateCollectionSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false,
      error: first?.message ?? "Invalid input"
    };
  }

  try {
    const updated = await updateCollectionForUser(
      session.user.id,
      collectionId,
      parsed.data
    );
    if (!updated) {
      return { success: false, error: "Collection not found" };
    }
    return { success: true };
  } catch (error) {
    console.error("updateCollectionAction failed", error);
    return {
      success: false,
      error: "Could not update collection. Please try again."
    };
  }
}

export type DeleteCollectionResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteCollectionAction(
  collectionId: string
): Promise<DeleteCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You are not signed in." };
  }

  if (typeof collectionId !== "string" || !collectionId) {
    return { success: false, error: "Invalid collection id" };
  }

  try {
    const deleted = await deleteCollectionForUser(session.user.id, collectionId);
    if (!deleted) {
      return { success: false, error: "Collection not found" };
    }
    return { success: true };
  } catch (error) {
    console.error("deleteCollectionAction failed", error);
    return {
      success: false,
      error: "Could not delete collection. Please try again."
    };
  }
}
