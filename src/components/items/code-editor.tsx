"use client";

import { useRef, useState } from "react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { Check, Copy, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { useEditorPreferences } from "@/components/editor/editor-preferences-context";
import { MONACO_THEMES } from "@/components/editor/monaco-themes";
import { Button } from "@/components/ui/button";
import { CODE_LANGUAGE_ALIASES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MIN_HEIGHT = 80;
const MAX_HEIGHT = 400;

const BASE_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  lineNumbers: "on",
  lineNumbersMinChars: 3,
  glyphMargin: false,
  folding: false,
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  automaticLayout: true,
  padding: { top: 12, bottom: 12 },
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
  const { prefs } = useEditorPreferences();

  const resolvedLanguage = normalizeLanguage(language);
  const themeMeta = MONACO_THEMES[prefs.theme];

  const handleBeforeMount: BeforeMount = (monaco) => {
    for (const [name, meta] of Object.entries(MONACO_THEMES)) {
      monaco.editor.defineTheme(name, meta.definition);
    }
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
        "overflow-hidden rounded-md border border-border/60",
        className
      )}
      style={{ background: themeMeta.chromeBg }}
      aria-label={ariaLabel}
    >
      <div
        className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2"
        style={{ background: themeMeta.chromeHeaderBg }}
      >
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
        theme={prefs.theme}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={(next) => onChange?.(next ?? "")}
        loading={<EditorLoading />}
        options={{
          ...BASE_OPTIONS,
          fontSize: prefs.fontSize,
          tabSize: prefs.tabSize,
          wordWrap: prefs.wordWrap ? "on" : "off",
          minimap: { enabled: prefs.minimap },
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
  return CODE_LANGUAGE_ALIASES[trimmed] ?? trimmed;
}
