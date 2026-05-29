"use server";

import { z } from "zod";

import { requireUserId } from "@/lib/actions/require-user";
import { firstIssue, type ActionResult } from "@/lib/actions/result";
import { checkCollectionCapacity, getUserIsPro } from "@/lib/billing";
import {
  createCollectionForUser,
  deleteCollectionForUser,
  setCollectionFavoriteForUser,
  updateCollectionForUser,
  type CollectionWithMeta
} from "@/lib/db/collections";
import { optionalTrimmedString } from "@/lib/zod-fields";

const createCollectionSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: "Name is required" }),
  description: optionalTrimmedString
});

export type CreateCollectionPayload = z.input<typeof createCollectionSchema>;

export type CreateCollectionResult = ActionResult<CollectionWithMeta>;

export async function createCollectionAction(
  payload: CreateCollectionPayload
): Promise<CreateCollectionResult> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }
  const { userId } = authed;

  const parsed = createCollectionSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }

  // Always re-read isPro from the DB — session.user.isPro can lag a Stripe
  // downgrade until the JWT refreshes on the next request.
  const isPro = await getUserIsPro(userId);
  const capacity = await checkCollectionCapacity(userId, isPro);
  if (!capacity.ok) {
    return { success: false, error: capacity.reason };
  }

  try {
    const created = await createCollectionForUser(userId, parsed.data);
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
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }

  if (typeof collectionId !== "string" || !collectionId) {
    return { success: false, error: "Invalid collection id" };
  }

  const parsed = updateCollectionSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }

  try {
    const updated = await updateCollectionForUser(
      authed.userId,
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

export type SetCollectionFavoriteResult =
  | { success: true; isFavorite: boolean }
  | { success: false; error: string };

export async function setCollectionFavoriteAction(
  collectionId: string,
  isFavorite: boolean
): Promise<SetCollectionFavoriteResult> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }

  if (typeof collectionId !== "string" || !collectionId) {
    return { success: false, error: "Invalid collection id" };
  }

  try {
    const updated = await setCollectionFavoriteForUser(
      authed.userId,
      collectionId,
      isFavorite
    );
    if (!updated) {
      return { success: false, error: "Collection not found" };
    }
    return { success: true, isFavorite };
  } catch (error) {
    console.error("setCollectionFavoriteAction failed", error);
    return {
      success: false,
      error: "Could not update favorite. Please try again."
    };
  }
}

export type DeleteCollectionResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteCollectionAction(
  collectionId: string
): Promise<DeleteCollectionResult> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }

  if (typeof collectionId !== "string" || !collectionId) {
    return { success: false, error: "Invalid collection id" };
  }

  try {
    const deleted = await deleteCollectionForUser(authed.userId, collectionId);
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
