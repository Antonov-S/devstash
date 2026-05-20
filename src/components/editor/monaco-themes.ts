import type { editor } from "monaco-editor";

import type { EditorTheme } from "@/lib/editor-preferences";

/**
 * Custom Monaco themes registered in `beforeMount`. We define our own under
 * the user-facing names (vs-dark / monokai / github-dark) so the chrome
 * background can match the editor background per theme.
 */
export const MONACO_THEMES: Record<
  EditorTheme,
  { definition: editor.IStandaloneThemeData; chromeBg: string; chromeHeaderBg: string }
> = {
  "vs-dark": {
    definition: {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#1a1a1a",
        "editor.foreground": "#e4e4e7",
        "editorLineNumber.foreground": "#52525b",
        "editorLineNumber.activeForeground": "#a1a1aa",
        "editor.lineHighlightBackground": "#23232380",
        "editor.lineHighlightBorder": "#00000000",
        "editor.selectionBackground": "#3f3f46",
        "editor.inactiveSelectionBackground": "#3f3f4680",
        "editorCursor.foreground": "#e4e4e7",
        "editorWhitespace.foreground": "#3f3f46",
        "editorIndentGuide.background1": "#27272a",
        "editorIndentGuide.activeBackground1": "#3f3f46",
        "scrollbarSlider.background": "#3f3f4680",
        "scrollbarSlider.hoverBackground": "#52525b80",
        "scrollbarSlider.activeBackground": "#71717a80",
        "editorWidget.background": "#1f1f1f",
        "editorWidget.border": "#27272a"
      }
    },
    chromeBg: "#1a1a1a",
    chromeHeaderBg: "#171717"
  },
  monokai: {
    definition: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "75715e" },
        { token: "string", foreground: "e6db74" },
        { token: "keyword", foreground: "f92672" },
        { token: "number", foreground: "ae81ff" },
        { token: "type", foreground: "66d9ef" },
        { token: "function", foreground: "a6e22e" }
      ],
      colors: {
        "editor.background": "#272822",
        "editor.foreground": "#f8f8f2",
        "editorLineNumber.foreground": "#75715e",
        "editorLineNumber.activeForeground": "#f8f8f2",
        "editor.lineHighlightBackground": "#3e3d3280",
        "editor.lineHighlightBorder": "#00000000",
        "editor.selectionBackground": "#49483e",
        "editorCursor.foreground": "#f8f8f0",
        "editorWhitespace.foreground": "#3b3a32",
        "editorIndentGuide.background1": "#3b3a32",
        "editorIndentGuide.activeBackground1": "#75715e",
        "scrollbarSlider.background": "#75715e60",
        "scrollbarSlider.hoverBackground": "#75715e90",
        "scrollbarSlider.activeBackground": "#a6e22e60",
        "editorWidget.background": "#1e1f1c",
        "editorWidget.border": "#3b3a32"
      }
    },
    chromeBg: "#272822",
    chromeHeaderBg: "#1e1f1c"
  },
  "github-dark": {
    definition: {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "8b949e" },
        { token: "string", foreground: "a5d6ff" },
        { token: "keyword", foreground: "ff7b72" },
        { token: "number", foreground: "79c0ff" },
        { token: "type", foreground: "ffa657" },
        { token: "function", foreground: "d2a8ff" }
      ],
      colors: {
        "editor.background": "#0d1117",
        "editor.foreground": "#c9d1d9",
        "editorLineNumber.foreground": "#484f58",
        "editorLineNumber.activeForeground": "#c9d1d9",
        "editor.lineHighlightBackground": "#161b2280",
        "editor.lineHighlightBorder": "#00000000",
        "editor.selectionBackground": "#264f78",
        "editorCursor.foreground": "#c9d1d9",
        "editorWhitespace.foreground": "#21262d",
        "editorIndentGuide.background1": "#21262d",
        "editorIndentGuide.activeBackground1": "#30363d",
        "scrollbarSlider.background": "#30363d80",
        "scrollbarSlider.hoverBackground": "#484f5880",
        "scrollbarSlider.activeBackground": "#6e768180",
        "editorWidget.background": "#161b22",
        "editorWidget.border": "#30363d"
      }
    },
    chromeBg: "#0d1117",
    chromeHeaderBg: "#161b22"
  }
};
