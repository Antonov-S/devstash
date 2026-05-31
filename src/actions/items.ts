"use server";

import { z } from "zod";

import { requireUserId } from "@/lib/actions/require-user";
import { firstIssue, type ActionResult } from "@/lib/actions/result";
import { checkItemCapacity, getUserIsPro } from "@/lib/billing";
import { PRO_ONLY_ITEM_TYPES } from "@/lib/constants";
import { verifyCollectionsOwnedByUser } from "@/lib/db/collections";
import {
  createItemForUser,
  deleteItemForUser,
  setItemCollectionsForUser,
  setItemFavoriteForUser,
  setItemPinnedForUser,
  updateItemForUser,
  type ItemDetail
} from "@/lib/db/items";
import { keyFromPublicUrl } from "@/lib/r2";
import {
  collectionIdsField,
  optionalTrimmedString,
  urlField
} from "@/lib/zod-fields";

const updateItemSchema = z.object({
  title: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: "Title is required" }),
  description: optionalTrimmedString,
  content: optionalTrimmedString,
  url: urlField,
  language: optionalTrimmedString,
  tags: z
    .array(z.string())
    .transform((tags) =>
      tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)
    ),
  collectionIds: collectionIdsField
});

export type UpdateItemPayload = z.input<typeof updateItemSchema>;

export type UpdateItemResult = ActionResult<ItemDetail>;

export async function updateItemAction(
  itemId: string,
  payload: UpdateItemPayload
): Promise<UpdateItemResult> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }
  const { userId } = authed;

  if (typeof itemId !== "string" || !itemId) {
    return { success: false, error: "Invalid item id" };
  }

  const parsed = updateItemSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }

  const uniqueCollectionIds = Array.from(new Set(parsed.data.collectionIds));
  if (uniqueCollectionIds.length > 0) {
    const ownsAll = await verifyCollectionsOwnedByUser(
      userId,
      uniqueCollectionIds
    );
    if (!ownsAll) {
      return { success: false, error: "Invalid collection" };
    }
  }

  try {
    const updated = await updateItemForUser(userId, itemId, {
      ...parsed.data,
      collectionIds: uniqueCollectionIds
    });
    if (!updated) {
      return { success: false, error: "Item not found" };
    }
    return { success: true, data: updated };
  } catch (error) {
    console.error("updateItemAction failed", error);
    return { success: false, error: "Could not update item. Please try again." };
  }
}

const CREATE_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
  "file",
  "image"
] as const;

export type CreateItemType = (typeof CREATE_TYPES)[number];

const FILE_TYPES = new Set<CreateItemType>(["file", "image"]);

const createItemSchema = z
  .object({
    type: z.enum(CREATE_TYPES),
    title: z
      .string()
      .transform((value) => value.trim())
      .refine((value) => value.length > 0, { message: "Title is required" }),
    description: optionalTrimmedString,
    content: optionalTrimmedString,
    url: urlField,
    language: optionalTrimmedString,
    fileUrl: optionalTrimmedString,
    fileName: optionalTrimmedString,
    fileSize: z
      .union([z.number().int().nonnegative(), z.null()])
      .optional()
      .transform((value) => (value == null ? null : value)),
    tags: z
      .array(z.string())
      .transform((tags) =>
        tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)
      ),
    collectionIds: collectionIdsField
  })
  .superRefine((data, ctx) => {
    if (data.type === "link" && !data.url) {
      ctx.addIssue({
        code: "custom",
        message: "URL is required",
        path: ["url"]
      });
    }
    if (FILE_TYPES.has(data.type)) {
      if (!data.fileUrl || !data.fileName || data.fileSize === null) {
        ctx.addIssue({
          code: "custom",
          message: "File upload is required",
          path: ["fileUrl"]
        });
      }
    }
  });

export type CreateItemPayload = z.input<typeof createItemSchema>;

export type CreateItemResult = ActionResult<ItemDetail>;

export async function createItemAction(
  payload: CreateItemPayload
): Promise<CreateItemResult> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }
  const { userId } = authed;

  const parsed = createItemSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }

  const { type, ...fields } = parsed.data;
  const isFileType = FILE_TYPES.has(type);

  // Always re-read isPro from the DB, never session.user.isPro — the JWT can
  // carry a stale value across a Stripe downgrade until the next refresh.
  const isPro = await getUserIsPro(userId);
  if (PRO_ONLY_ITEM_TYPES.has(type) && !isPro) {
    return { success: false, error: "File and image items require Pro." };
  }
  const capacity = await checkItemCapacity(userId, isPro);
  if (!capacity.ok) {
    return { success: false, error: capacity.reason };
  }

  if (isFileType && fields.fileUrl) {
    // Make sure the client didn't supply a URL pointing at another user's R2
    // object. Uploads always land under `uploads/<userId>/...` so a key that
    // doesn't match the session user is either tampered or not from our bucket.
    const key = keyFromPublicUrl(fields.fileUrl);
    const expectedPrefix = `uploads/${userId}/`;
    if (!key || !key.startsWith(expectedPrefix)) {
      return { success: false, error: "Invalid file upload" };
    }
  }

  const uniqueCollectionIds = Array.from(new Set(fields.collectionIds));
  if (uniqueCollectionIds.length > 0) {
    const ownsAll = await verifyCollectionsOwnedByUser(
      userId,
      uniqueCollectionIds
    );
    if (!ownsAll) {
      return { success: false, error: "Invalid collection" };
    }
  }

  try {
    const created = await createItemForUser(userId, {
      typeName: type,
      title: fields.title,
      description: fields.description,
      content: type === "link" || isFileType ? null : fields.content,
      url: type === "link" ? fields.url : null,
      language: type === "snippet" || type === "command" ? fields.language : null,
      fileUrl: isFileType ? fields.fileUrl : null,
      fileName: isFileType ? fields.fileName : null,
      fileSize: isFileType ? fields.fileSize : null,
      tags: fields.tags,
      collectionIds: uniqueCollectionIds
    });
    if (!created) {
      return { success: false, error: "Item type not found" };
    }
    return { success: true, data: created };
  } catch (error) {
    console.error("createItemAction failed", error);
    return { success: false, error: "Could not create item. Please try again." };
  }
}

export type SetItemFavoriteResult =
  | { success: true; isFavorite: boolean }
  | { success: false; error: string };

export async function setItemFavoriteAction(
  itemId: string,
  isFavorite: boolean
): Promise<SetItemFavoriteResult> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }

  if (typeof itemId !== "string" || !itemId) {
    return { success: false, error: "Invalid item id" };
  }

  try {
    const updated = await setItemFavoriteForUser(
      authed.userId,
      itemId,
      isFavorite
    );
    if (!updated) {
      return { success: false, error: "Item not found" };
    }
    return { success: true, isFavorite };
  } catch (error) {
    console.error("setItemFavoriteAction failed", error);
    return { success: false, error: "Could not update favorite. Please try again." };
  }
}

export type SetItemPinnedResult =
  | { success: true; isPinned: boolean }
  | { success: false; error: string };

export async function setItemPinnedAction(
  itemId: string,
  isPinned: boolean
): Promise<SetItemPinnedResult> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }

  if (typeof itemId !== "string" || !itemId) {
    return { success: false, error: "Invalid item id" };
  }

  try {
    const updated = await setItemPinnedForUser(
      authed.userId,
      itemId,
      isPinned
    );
    if (!updated) {
      return { success: false, error: "Item not found" };
    }
    return { success: true, isPinned };
  } catch (error) {
    console.error("setItemPinnedAction failed", error);
    return { success: false, error: "Could not update pin. Please try again." };
  }
}

export type SetItemCollectionsResult =
  | { success: true }
  | { success: false; error: string };

export async function setItemCollectionsAction(
  itemId: string,
  collectionIds: string[]
): Promise<SetItemCollectionsResult> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }
  const { userId } = authed;

  if (typeof itemId !== "string" || !itemId) {
    return { success: false, error: "Invalid item id" };
  }

  const parsed = collectionIdsField.safeParse(collectionIds);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }

  const uniqueCollectionIds = Array.from(new Set(parsed.data));
  // Collections are a free-tier feature — no Pro gate here (unlike folders).
  if (uniqueCollectionIds.length > 0) {
    const ownsAll = await verifyCollectionsOwnedByUser(
      userId,
      uniqueCollectionIds
    );
    if (!ownsAll) {
      return { success: false, error: "Invalid collection" };
    }
  }

  try {
    const updated = await setItemCollectionsForUser(
      userId,
      itemId,
      uniqueCollectionIds
    );
    if (!updated) {
      return { success: false, error: "Item not found" };
    }
    return { success: true };
  } catch (error) {
    console.error("setItemCollectionsAction failed", error);
    return {
      success: false,
      error: "Could not update collections. Please try again."
    };
  }
}

export type DeleteItemResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteItemAction(
  itemId: string
): Promise<DeleteItemResult> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }

  if (typeof itemId !== "string" || !itemId) {
    return { success: false, error: "Invalid item id" };
  }

  try {
    const deleted = await deleteItemForUser(authed.userId, itemId);
    if (!deleted) {
      return { success: false, error: "Item not found" };
    }
    return { success: true };
  } catch (error) {
    console.error("deleteItemAction failed", error);
    return { success: false, error: "Could not delete item. Please try again." };
  }
}
