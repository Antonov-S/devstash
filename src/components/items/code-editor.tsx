"use client";

import { useRef, useState } from "react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { Check, Copy, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const THEME_NAME = "devstash-dark";

const MIN_HEIGHT = 80;
const MAX_HEIGHT = 400;

const COMMON_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  fontSize: 13,
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  lineNumbers: "on",
  lineNumbersMinChars: 3,
  glyphMargin: false,
  folding: false,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  automaticLayout: true,
  padding: { top: 12, bottom: 12 },
  wordWrap: "on",
  wrappingIndent: "indent",
  renderLineHighlight: "line",
  scrollbar: {
    vertical: "auto",
    horizontal: "auto",
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
    useShadows: false
  },
  overviewRulerBorder: false,
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  tabSize: 2,
  fixedOverflowWidgets: true
};

type Props = {
  value: string;
  language?: string | null;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  ariaLabel?: string;
};

export function CodeEditor({
  value,
  language,
  readOnly = false,
  onChange,
  className,
  ariaLabel
}: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [height, setHeight] = useState<number>(MIN_HEIGHT);
  const [copied, setCopied] = useState(false);

  const resolvedLanguage = normalizeLanguage(language);

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme(THEME_NAME, {
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
    });
  };

  const handleMount: OnMount = (instance) => {
    editorRef.current = instance;
    const updateHeight = () => {
      const contentHeight = instance.getContentHeight();
      const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, contentHeight));
      setHeight(next);
    };
    instance.onDidContentSizeChange(updateHeight);
    updateHeight();
  };

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value ?? "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border/60 bg-[#1a1a1a]",
        className
      )}
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-[#171717] px-3 py-2">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex items-center gap-2">
          {resolvedLanguage && (
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {resolvedLanguage}
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            aria-label="Copy code"
            className="text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-400" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
          </Button>
        </div>
      </div>
      <Editor
        height={height}
        value={value}
        language={resolvedLanguage ?? "plaintext"}
        theme={THEME_NAME}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={(next) => onChange?.(next ?? "")}
        loading={<EditorLoading />}
        options={{
          ...COMMON_OPTIONS,
          readOnly,
          domReadOnly: readOnly,
          renderLineHighlight: readOnly ? "none" : "line",
          cursorStyle: readOnly ? "line-thin" : "line",
          contextmenu: !readOnly
        }}
      />
    </div>
  );
}

function EditorLoading() {
  return (
    <div className="flex items-center gap-2 px-4 py-6 text-xs text-muted-foreground">
      <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
      Loading editor…
    </div>
  );
}

function normalizeLanguage(input?: string | null): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return undefined;
  return LANGUAGE_ALIASES[trimmed] ?? trimmed;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  yml: "yaml",
  md: "markdown",
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  golang: "go",
  rs: "rust"
};
