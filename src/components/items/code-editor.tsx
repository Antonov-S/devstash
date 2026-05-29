"use client";

import { useRef, useState, useTransition } from "react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { LoaderCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { explainCode } from "@/actions/ai-explain";
import { useIsPro } from "@/components/billing/is-pro-context";
import { useEditorPreferences } from "@/components/editor/editor-preferences-context";
import { MONACO_THEMES } from "@/components/editor/monaco-themes";
import {
  EDITOR_MAX_HEIGHT,
  EDITOR_MIN_HEIGHT,
  EditorAiButton,
  EditorCopyButton,
  EditorTabButton
} from "@/components/items/editor-chrome";
import { CODE_LANGUAGE_ALIASES } from "@/lib/constants";
import { toastActionError } from "@/lib/toast-error";
import { cn } from "@/lib/utils";

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

export type ExplainContext = {
  typeName: "snippet" | "command";
  title?: string | null;
};

type Props = {
  value: string;
  language?: string | null;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  ariaLabel?: string;
  explainContext?: ExplainContext;
};

type Tab = "code" | "explain";

export function CodeEditor({
  value,
  language,
  readOnly = false,
  onChange,
  className,
  ariaLabel,
  explainContext
}: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [height, setHeight] = useState<number>(EDITOR_MIN_HEIGHT);
  const [copied, setCopied] = useState(false);
  const { prefs } = useEditorPreferences();
  const isPro = useIsPro();
  const [tab, setTab] = useState<Tab>("code");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, startExplaining] = useTransition();

  const resolvedLanguage = normalizeLanguage(language);
  const themeMeta = MONACO_THEMES[prefs.theme];
  const explainEnabled = !!explainContext;
  const showsTabs = explainEnabled && explanation !== null;

  const handleBeforeMount: BeforeMount = (monaco) => {
    for (const [name, meta] of Object.entries(MONACO_THEMES)) {
      monaco.editor.defineTheme(name, meta.definition);
    }
  };

  const handleMount: OnMount = (instance) => {
    editorRef.current = instance;
    const updateHeight = () => {
      const contentHeight = instance.getContentHeight();
      const next = Math.min(
        EDITOR_MAX_HEIGHT,
        Math.max(EDITOR_MIN_HEIGHT, contentHeight)
      );
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

  function handleExplain() {
    if (!explainContext) return;
    if (!isPro) return;
    if (explaining) return;
    if (!value || !value.trim()) {
      toast.error("There's no code to explain.");
      return;
    }
    startExplaining(async () => {
      const result = await explainCode({
        typeName: explainContext.typeName,
        title: explainContext.title ?? null,
        content: value,
        language: resolvedLanguage ?? null
      });
      if (!result.success) {
        toastActionError(result.error, () =>
          window.location.assign("/upgrade")
        );
        return;
      }
      setExplanation(result.explanation);
      setTab("explain");
    });
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
        <div className="flex items-center gap-2">
          {showsTabs ? (
            <div
              role="tablist"
              aria-label="Code or explanation"
              className="flex items-center gap-0.5 rounded-md bg-[#0f0f0f] p-0.5"
            >
              <EditorTabButton
                active={tab === "code"}
                onClick={() => setTab("code")}
                label="Code"
              />
              <EditorTabButton
                active={tab === "explain"}
                onClick={() => setTab("explain")}
                label="Explain"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5" aria-hidden>
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {resolvedLanguage && (
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {resolvedLanguage}
            </span>
          )}
          {explainEnabled && (
            <EditorAiButton
              pending={explaining}
              disabled={explaining}
              onClick={handleExplain}
              ariaLabel={explanation ? "Regenerate explanation" : "Explain code"}
            />
          )}
          <EditorCopyButton
            copied={copied}
            onCopy={handleCopy}
            ariaLabel="Copy code"
          />
        </div>
      </div>
      {showsTabs && tab === "explain" ? (
        <div
          className="devstash-scroll overflow-y-auto bg-[#1a1a1a]"
          style={{ maxHeight: EDITOR_MAX_HEIGHT }}
        >
          <div
            className="markdown-preview px-4 py-3"
            style={{ minHeight: EDITOR_MIN_HEIGHT }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {explanation ?? ""}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
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
      )}
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
