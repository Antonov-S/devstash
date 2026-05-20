import { z } from "zod";

export const FONT_SIZES = [11, 12, 13, 14, 15, 16, 18] as const;
export const TAB_SIZES = [2, 4, 8] as const;
export const EDITOR_THEMES = ["vs-dark", "monokai", "github-dark"] as const;

export type EditorFontSize = (typeof FONT_SIZES)[number];
export type EditorTabSize = (typeof TAB_SIZES)[number];
export type EditorTheme = (typeof EDITOR_THEMES)[number];

export type EditorPreferences = {
  fontSize: EditorFontSize;
  tabSize: EditorTabSize;
  wordWrap: boolean;
  minimap: boolean;
  theme: EditorTheme;
};

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark"
};

export const editorPreferencesSchema = z.object({
  fontSize: z
    .number()
    .int()
    .refine((v): v is EditorFontSize => (FONT_SIZES as readonly number[]).includes(v), {
      message: "Invalid font size"
    }),
  tabSize: z
    .number()
    .int()
    .refine((v): v is EditorTabSize => (TAB_SIZES as readonly number[]).includes(v), {
      message: "Invalid tab size"
    }),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEMES)
});

/**
 * Coerce any stored JSON value back to a valid EditorPreferences, filling in
 * defaults for missing/invalid fields rather than throwing. Used on read so a
 * partial or stale value (e.g. from an older schema version) keeps working.
 */
export function parseEditorPreferences(raw: unknown): EditorPreferences {
  if (!raw || typeof raw !== "object") return DEFAULT_EDITOR_PREFERENCES;
  const obj = raw as Record<string, unknown>;

  const fontSize = (FONT_SIZES as readonly number[]).includes(obj.fontSize as number)
    ? (obj.fontSize as EditorFontSize)
    : DEFAULT_EDITOR_PREFERENCES.fontSize;
  const tabSize = (TAB_SIZES as readonly number[]).includes(obj.tabSize as number)
    ? (obj.tabSize as EditorTabSize)
    : DEFAULT_EDITOR_PREFERENCES.tabSize;
  const wordWrap =
    typeof obj.wordWrap === "boolean"
      ? obj.wordWrap
      : DEFAULT_EDITOR_PREFERENCES.wordWrap;
  const minimap =
    typeof obj.minimap === "boolean"
      ? obj.minimap
      : DEFAULT_EDITOR_PREFERENCES.minimap;
  const theme = (EDITOR_THEMES as readonly string[]).includes(obj.theme as string)
    ? (obj.theme as EditorTheme)
    : DEFAULT_EDITOR_PREFERENCES.theme;

  return { fontSize, tabSize, wordWrap, minimap, theme };
}
