import { describe, it, expect } from "vitest";

import {
  DEFAULT_EDITOR_PREFERENCES,
  parseEditorPreferences,
  editorPreferencesSchema
} from "@/lib/editor-preferences";

describe("parseEditorPreferences", () => {
  it("returns defaults for null/undefined", () => {
    expect(parseEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(parseEditorPreferences(undefined)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns defaults for non-object input", () => {
    expect(parseEditorPreferences("hello")).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(parseEditorPreferences(42)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns defaults for empty object", () => {
    expect(parseEditorPreferences({})).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("fills in defaults for invalid field types", () => {
    expect(
      parseEditorPreferences({
        fontSize: "huge",
        tabSize: "two",
        wordWrap: "yes",
        minimap: 1,
        theme: "dracula"
      })
    ).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("rejects out-of-allowlist fontSize/tabSize/theme values", () => {
    expect(
      parseEditorPreferences({
        fontSize: 99,
        tabSize: 7,
        wordWrap: false,
        minimap: true,
        theme: "solarized"
      })
    ).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      wordWrap: false,
      minimap: true
    });
  });

  it("merges a partial valid object with defaults", () => {
    expect(
      parseEditorPreferences({ fontSize: 16, theme: "monokai" })
    ).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 16,
      theme: "monokai"
    });
  });

  it("returns a fully valid object unchanged", () => {
    const input = {
      fontSize: 14,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "github-dark" as const
    };
    expect(parseEditorPreferences(input)).toEqual(input);
  });
});

describe("editorPreferencesSchema", () => {
  it("accepts a fully valid object", () => {
    const result = editorPreferencesSchema.safeParse({
      fontSize: 13,
      tabSize: 2,
      wordWrap: true,
      minimap: false,
      theme: "vs-dark"
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown theme", () => {
    const result = editorPreferencesSchema.safeParse({
      fontSize: 13,
      tabSize: 2,
      wordWrap: true,
      minimap: false,
      theme: "dracula"
    });
    expect(result.success).toBe(false);
  });

  it("rejects a fontSize outside the allowlist", () => {
    const result = editorPreferencesSchema.safeParse({
      fontSize: 99,
      tabSize: 2,
      wordWrap: true,
      minimap: false,
      theme: "vs-dark"
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-boolean wordWrap", () => {
    const result = editorPreferencesSchema.safeParse({
      fontSize: 13,
      tabSize: 2,
      wordWrap: "yes",
      minimap: false,
      theme: "vs-dark"
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing field", () => {
    const result = editorPreferencesSchema.safeParse({
      fontSize: 13,
      tabSize: 2,
      wordWrap: true,
      theme: "vs-dark"
    });
    expect(result.success).toBe(false);
  });
});
