"use server";

import { auth } from "@/auth";
import { updateUserEditorPreferences } from "@/lib/db/users";
import {
  editorPreferencesSchema,
  type EditorPreferences
} from "@/lib/editor-preferences";

export type UpdateEditorPreferencesResult =
  | { success: true; data: EditorPreferences }
  | { success: false; error: string };

export async function updateEditorPreferencesAction(
  payload: unknown
): Promise<UpdateEditorPreferencesResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You are not signed in." };
  }

  const parsed = editorPreferencesSchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Invalid input" };
  }

  try {
    const saved = await updateUserEditorPreferences(session.user.id, parsed.data);
    return { success: true, data: saved };
  } catch (error) {
    console.error("updateEditorPreferencesAction failed", error);
    return {
      success: false,
      error: "Could not save editor preferences. Please try again."
    };
  }
}
