"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { verifyCollectionsOwnedByUser } from "@/lib/db/collections";
import {
  createItemForUser,
  deleteItemForUser,
  setItemFavoriteForUser,
  updateItemForUser,
  type ItemDetail
} from "@/lib/db/items";
import { keyFromPublicUrl } from "@/lib/r2";

function normalizeOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

const optionalTrimmedString = z
  .union([z.string(), z.null()])
  .optional()
  .transform(normalizeOptional);

const urlField = z
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

const collectionIdsField = z
  .array(z.string())
  .optional()
  .transform((ids) =>
    (ids ?? []).map((id) => id.trim()).filter((id) => id.length > 0)
  );

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

export type UpdateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string };

export async function updateItemAction(
  itemId: string,
  payload: UpdateItemPayload
): Promise<UpdateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You are not signed in." };
  }

  if (typeof itemId !== "string" || !itemId) {
    return { success: false, error: "Invalid item id" };
  }

  const parsed = updateItemSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false,
      error: first?.message ?? "Invalid input"
    };
  }

  const uniqueCollectionIds = Array.from(new Set(parsed.data.collectionIds));
  if (uniqueCollectionIds.length > 0) {
    const ownsAll = await verifyCollectionsOwnedByUser(
      session.user.id,
      uniqueCollectionIds
    );
    if (!ownsAll) {
      return { success: false, error: "Invalid collection" };
    }
  }

  try {
    const updated = await updateItemForUser(session.user.id, itemId, {
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

export type CreateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string };

export async function createItemAction(
  payload: CreateItemPayload
): Promise<CreateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You are not signed in." };
  }

  const parsed = createItemSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false,
      error: first?.message ?? "Invalid input"
    };
  }

  const { type, ...fields } = parsed.data;
  const isFileType = FILE_TYPES.has(type);

  if (isFileType && fields.fileUrl) {
    // Make sure the client didn't supply a URL pointing at another user's R2
    // object. Uploads always land under `uploads/<userId>/...` so a key that
    // doesn't match the session user is either tampered or not from our bucket.
    const key = keyFromPublicUrl(fields.fileUrl);
    const expectedPrefix = `uploads/${session.user.id}/`;
    if (!key || !key.startsWith(expectedPrefix)) {
      return { success: false, error: "Invalid file upload" };
    }
  }

  const uniqueCollectionIds = Array.from(new Set(fields.collectionIds));
  if (uniqueCollectionIds.length > 0) {
    const ownsAll = await verifyCollectionsOwnedByUser(
      session.user.id,
      uniqueCollectionIds
    );
    if (!ownsAll) {
      return { success: false, error: "Invalid collection" };
    }
  }

  try {
    const created = await createItemForUser(session.user.id, {
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
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You are not signed in." };
  }

  if (typeof itemId !== "string" || !itemId) {
    return { success: false, error: "Invalid item id" };
  }

  try {
    const updated = await setItemFavoriteForUser(
      session.user.id,
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

export type DeleteItemResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteItemAction(
  itemId: string
): Promise<DeleteItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You are not signed in." };
  }

  if (typeof itemId !== "string" || !itemId) {
    return { success: false, error: "Invalid item id" };
  }

  try {
    const deleted = await deleteItemForUser(session.user.id, itemId);
    if (!deleted) {
      return { success: false, error: "Item not found" };
    }
    return { success: true };
  } catch (error) {
    console.error("deleteItemAction failed", error);
    return { success: false, error: "Could not delete item. Please try again." };
  }
}
