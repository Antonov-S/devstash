"use client";

import { useRef, useState, useTransition } from "react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import {
  Check,
  Copy,
  Crown,
  LoaderCircle,
  Sparkles
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { explainCode } from "@/actions/ai-explain";
import { useIsPro } from "@/components/billing/is-pro-context";
import { useEditorPreferences } from "@/components/editor/editor-preferences-context";
import { MONACO_THEMES } from "@/components/editor/monaco-themes";
import { Button } from "@/components/ui/button";
import { AI_ACCENT_COLOR, CODE_LANGUAGE_ALIASES } from "@/lib/constants";
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
  const [height, setHeight] = useState<number>(MIN_HEIGHT);
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
        toast.error(result.error, {
          action: result.error.includes("Pro")
            ? { label: "Upgrade", onClick: () => window.location.assign("/upgrade") }
            : undefined
        });
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
              <TabButton
                active={tab === "code"}
                onClick={() => setTab("code")}
                label="Code"
              />
              <TabButton
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
            isPro ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleExplain}
                disabled={explaining}
                aria-label={explanation ? "Regenerate explanation" : "Explain code"}
                title={explanation ? "Regenerate explanation" : "Explain code"}
                className="hover:bg-transparent"
                style={{ color: AI_ACCENT_COLOR }}
              >
                {explaining ? (
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="size-3.5" aria-hidden />
                )}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled
                aria-label="AI features require Pro subscription"
                title="AI features require Pro subscription"
                className="cursor-not-allowed text-muted-foreground opacity-70 disabled:opacity-70"
              >
                <Crown className="size-3.5" aria-hidden />
              </Button>
            )
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
      {showsTabs && tab === "explain" ? (
        <div
          className="devstash-scroll overflow-y-auto bg-[#1a1a1a]"
          style={{ maxHeight: MAX_HEIGHT }}
        >
          <div
            className="markdown-preview px-4 py-3"
            style={{ minHeight: MIN_HEIGHT }}
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

function TabButton({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active
          ? "bg-[#2d2d2d] text-zinc-100"
          : "text-zinc-400 hover:text-zinc-100"
      )}
    >
      {label}
    </button>
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
