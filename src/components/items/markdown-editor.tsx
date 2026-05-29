"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, Pencil } from "lucide-react";
import { toast } from "sonner";

import { optimizePrompt } from "@/actions/ai-optimize-prompt";
import { useIsPro } from "@/components/billing/is-pro-context";
import { useEditorPreferences } from "@/components/editor/editor-preferences-context";
import {
  EDITOR_MAX_HEIGHT,
  EDITOR_MIN_HEIGHT,
  EditorAiButton,
  EditorCopyButton,
  EditorTabButton
} from "@/components/items/editor-chrome";
import {
  OptimizedPromptCompareHeader,
  type CompareTab
} from "@/components/items/optimized-prompt-compare";
import { toastActionError } from "@/lib/toast-error";
import { cn } from "@/lib/utils";

type Tab = "write" | "preview";

export type OptimizeContext = {
  typeName: "prompt";
  title?: string | null;
};

type Props = {
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  optimizeContext?: OptimizeContext;
  onApplyOptimized?: (newContent: string) => void;
  applyingOptimized?: boolean;
};

export function MarkdownEditor({
  value,
  readOnly = false,
  onChange,
  placeholder,
  className,
  ariaLabel,
  optimizeContext,
  onApplyOptimized,
  applyingOptimized = false
}: Props) {
  const [tab, setTab] = useState<Tab>(readOnly ? "preview" : "write");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isPro = useIsPro();
  const { prefs } = useEditorPreferences();
  const [refined, setRefined] = useState<string | null>(null);
  const [optimizing, startOptimizing] = useTransition();
  const [compareTab, setCompareTab] = useState<CompareTab>("refined");

  const optimizeEnabled = !!optimizeContext;
  const inRefinedPreview = refined !== null;
  const visibleCompareContent = compareTab === "original" ? value : (refined ?? "");

  useEffect(() => {
    if (readOnly && tab !== "preview") setTab("preview");
  }, [readOnly, tab]);

  useEffect(() => {
    if (tab !== "write") return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(
      EDITOR_MAX_HEIGHT,
      Math.max(EDITOR_MIN_HEIGHT, el.scrollHeight)
    );
    el.style.height = `${next}px`;
  }, [tab, value]);

  // If the parent successfully applies the optimized prompt, `value` updates
  // and we should leave the refined preview state.
  useEffect(() => {
    if (refined && refined === value) {
      setRefined(null);
    }
  }, [refined, value]);

  async function handleCopy() {
    const textToCopy = inRefinedPreview ? visibleCompareContent : (value ?? "");
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  function handleOptimize() {
    if (!optimizeContext) return;
    if (!isPro) return;
    if (optimizing || applyingOptimized) return;
    if (!value || !value.trim()) {
      toast.error("There's nothing to optimize.");
      return;
    }
    startOptimizing(async () => {
      const result = await optimizePrompt({
        typeName: optimizeContext.typeName,
        title: optimizeContext.title ?? null,
        content: value
      });
      if (!result.success) {
        toastActionError(result.error, () =>
          window.location.assign("/upgrade")
        );
        return;
      }
      if (result.prompt.trim() === value.trim()) {
        toast.success("Your prompt already looks great — no changes suggested.");
        return;
      }
      setRefined(result.prompt);
      setCompareTab("refined");
    });
  }

  function handleApply() {
    if (!refined || !onApplyOptimized) return;
    onApplyOptimized(refined);
  }

  function handleDiscard() {
    if (applyingOptimized) return;
    setRefined(null);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border/60 bg-[#1a1a1a]",
        className
      )}
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          "flex gap-2 border-b border-border/60 bg-[#171717] px-3 py-2",
          inRefinedPreview
            ? "flex-col sm:flex-row sm:items-center sm:justify-between"
            : "items-center justify-between"
        )}
      >
        {inRefinedPreview ? (
          <OptimizedPromptCompareHeader
            compareTab={compareTab}
            onCompareTabChange={setCompareTab}
            applyingOptimized={applyingOptimized}
            onDiscard={handleDiscard}
            onApply={handleApply}
          />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div
                role="tablist"
                aria-label="Markdown editor mode"
                className="flex items-center gap-0.5 rounded-md bg-[#0f0f0f] p-0.5"
              >
                {!readOnly && (
                  <EditorTabButton
                    active={tab === "write"}
                    onClick={() => setTab("write")}
                    icon={<Pencil className="size-3.5" aria-hidden />}
                    label="Write"
                  />
                )}
                <EditorTabButton
                  active={tab === "preview"}
                  onClick={() => setTab("preview")}
                  icon={<Eye className="size-3.5" aria-hidden />}
                  label="Preview"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              {optimizeEnabled && (
                <EditorAiButton
                  pending={optimizing}
                  disabled={optimizing || applyingOptimized}
                  onClick={handleOptimize}
                  ariaLabel="Optimize prompt"
                />
              )}
              <EditorCopyButton
                copied={copied}
                onCopy={handleCopy}
                ariaLabel="Copy markdown"
              />
            </div>
          </>
        )}
      </div>

      <div
        className="devstash-scroll overflow-y-auto"
        style={{ maxHeight: EDITOR_MAX_HEIGHT }}
      >
        {inRefinedPreview ? (
          <MarkdownPreview value={visibleCompareContent} fontSize={prefs.fontSize} />
        ) : tab === "write" && !readOnly ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
            className="devstash-scroll block w-full resize-none border-0 bg-transparent px-4 py-3 font-mono leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500"
            style={{ minHeight: EDITOR_MIN_HEIGHT, fontSize: prefs.fontSize }}
            aria-label={ariaLabel}
          />
        ) : (
          <MarkdownPreview value={value} fontSize={prefs.fontSize} />
        )}
      </div>
    </div>
  );
}

function MarkdownPreview({
  value,
  fontSize
}: {
  value: string;
  fontSize: number;
}) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return (
      <p
        className="px-4 py-3 text-zinc-500"
        style={{ minHeight: EDITOR_MIN_HEIGHT, fontSize }}
      >
        Nothing to preview yet.
      </p>
    );
  }
  return (
    <div
      className="markdown-preview px-4 py-3"
      style={{ minHeight: EDITOR_MIN_HEIGHT, fontSize }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
    </div>
  );
}
