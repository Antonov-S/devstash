"use server";

import { z } from "zod";

import { requireUserId } from "@/lib/actions/require-user";
import { firstIssue, type ActionResult } from "@/lib/actions/result";
import { getUserIsPro } from "@/lib/billing";
import { FOLDER_NAME_MAX_LENGTH } from "@/lib/constants";
import {
  createFolderForUser,
  deleteFolderForUser,
  moveItemToFolder,
  updateFolderForUser,
  type FolderWithMeta
} from "@/lib/db/folders";

// Shared by create + rename so validation can't drift between the two paths.
const folderNameSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: "Name is required" })
    .refine((value) => value.length <= FOLDER_NAME_MAX_LENGTH, {
      message: "Name is too long"
    })
});

export type FolderNamePayload = z.input<typeof folderNameSchema>;

export type CreateFolderResult = ActionResult<FolderWithMeta>;

export async function createFolderAction(
  payload: FolderNamePayload
): Promise<CreateFolderResult> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }
  const { userId } = authed;

  const parsed = folderNameSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }

  // Folders are a file/image (Pro) feature. Re-read from the DB — the JWT can
  // lag a Stripe downgrade until the next session refresh.
  const isPro = await getUserIsPro(userId);
  if (!isPro) {
    return { success: false, error: "Folders require Pro." };
  }

  try {
    const created = await createFolderForUser(userId, parsed.data);
    return { success: true, data: created };
  } catch (error) {
    console.error("createFolderAction failed", error);
    return {
      success: false,
      error: "Could not create folder. Please try again."
    };
  }
}

export type UpdateFolderResult =
  | { success: true }
  | { success: false; error: string };

export async function updateFolderAction(
  folderId: string,
  payload: FolderNamePayload
): Promise<UpdateFolderResult> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }

  if (typeof folderId !== "string" || !folderId) {
    return { success: false, error: "Invalid folder id" };
  }

  const parsed = folderNameSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }

  try {
    const updated = await updateFolderForUser(
      authed.userId,
      folderId,
      parsed.data
    );
    if (!updated) {
      return { success: false, error: "Folder not found" };
    }
    return { success: true };
  } catch (error) {
    console.error("updateFolderAction failed", error);
    return {
      success: false,
      error: "Could not update folder. Please try again."
    };
  }
}

export type DeleteFolderResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteFolderAction(
  folderId: string
): Promise<DeleteFolderResult> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }

  if (typeof folderId !== "string" || !folderId) {
    return { success: false, error: "Invalid folder id" };
  }

  try {
    const deleted = await deleteFolderForUser(authed.userId, folderId);
    if (!deleted) {
      return { success: false, error: "Folder not found" };
    }
    return { success: true };
  } catch (error) {
    console.error("deleteFolderAction failed", error);
    return {
      success: false,
      error: "Could not delete folder. Please try again."
    };
  }
}

export type MoveItemToFolderResult =
  | { success: true }
  | { success: false; error: string };

export async function moveItemToFolderAction(
  itemId: string,
  folderId: string | null
): Promise<MoveItemToFolderResult> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }
  const { userId } = authed;

  if (typeof itemId !== "string" || !itemId) {
    return { success: false, error: "Invalid item id" };
  }

  // Folders are a file/image (Pro) feature — re-read from the DB.
  const isPro = await getUserIsPro(userId);
  if (!isPro) {
    return { success: false, error: "Folders require Pro." };
  }

  try {
    const result = await moveItemToFolder(userId, itemId, folderId);
    if (!result.ok) {
      switch (result.reason) {
        case "invalid-folder":
          return { success: false, error: "Invalid folder" };
        case "wrong-type":
          return {
            success: false,
            error: "Only files and images can go in folders."
          };
        default:
          return { success: false, error: "Item not found" };
      }
    }
    return { success: true };
  } catch (error) {
    console.error("moveItemToFolderAction failed", error);
    return {
      success: false,
      error: "Could not move item. Please try again."
    };
  }
}
