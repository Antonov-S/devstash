"use server";

import { requireUserId } from "@/lib/actions/require-user";
import { firstIssue, type ActionResult } from "@/lib/actions/result";
import { updateUserEditorPreferences } from "@/lib/db/users";
import {
  editorPreferencesSchema,
  type EditorPreferences
} from "@/lib/editor-preferences";

export type UpdateEditorPreferencesResult = ActionResult<EditorPreferences>;

export async function updateEditorPreferencesAction(
  payload: unknown
): Promise<UpdateEditorPreferencesResult> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { success: false, error: authed.error };
  }

  const parsed = editorPreferencesSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: firstIssue(parsed.error) };
  }

  try {
    const saved = await updateUserEditorPreferences(authed.userId, parsed.data);
    return { success: true, data: saved };
  } catch (error) {
    console.error("updateEditorPreferencesAction failed", error);
    return {
      success: false,
      error: "Could not save editor preferences. Please try again."
    };
  }
}
