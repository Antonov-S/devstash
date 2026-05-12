"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { updateItemForUser, type ItemDetail } from "@/lib/db/items";

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
    )
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

  try {
    const updated = await updateItemForUser(
      session.user.id,
      itemId,
      parsed.data
    );
    if (!updated) {
      return { success: false, error: "Item not found" };
    }
    return { success: true, data: updated };
  } catch (error) {
    console.error("updateItemAction failed", error);
    return { success: false, error: "Could not update item. Please try again." };
  }
}
