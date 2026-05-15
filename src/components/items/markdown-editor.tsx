"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_HEIGHT = 80;
const MAX_HEIGHT = 400;

type Tab = "write" | "preview";

type Props = {
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
};

export function MarkdownEditor({
  value,
  readOnly = false,
  onChange,
  placeholder,
  className,
  ariaLabel
}: Props) {
  const [tab, setTab] = useState<Tab>(readOnly ? "preview" : "write");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (readOnly && tab !== "preview") setTab("preview");
  }, [readOnly, tab]);

  useEffect(() => {
    if (tab !== "write") return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(
      MAX_HEIGHT,
      Math.max(MIN_HEIGHT, el.scrollHeight)
    );
    el.style.height = `${next}px`;
  }, [tab, value]);

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
        <div
          role="tablist"
          aria-label="Markdown editor mode"
          className="flex items-center gap-0.5 rounded-md bg-[#0f0f0f] p-0.5"
        >
          {!readOnly && (
            <TabButton
              active={tab === "write"}
              onClick={() => setTab("write")}
              icon={<Pencil className="size-3.5" aria-hidden />}
              label="Write"
            />
          )}
          <TabButton
            active={tab === "preview"}
            onClick={() => setTab("preview")}
            icon={<Eye className="size-3.5" aria-hidden />}
            label="Preview"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleCopy}
          aria-label="Copy markdown"
          className="text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-400" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
        </Button>
      </div>

      <div
        className="devstash-scroll overflow-y-auto"
        style={{ maxHeight: MAX_HEIGHT }}
      >
        {tab === "write" && !readOnly ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
            className="devstash-scroll block w-full resize-none border-0 bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500"
            style={{ minHeight: MIN_HEIGHT }}
            aria-label={ariaLabel}
          />
        ) : (
          <MarkdownPreview value={value} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
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
      {icon}
      {label}
    </button>
  );
}

function MarkdownPreview({ value }: { value: string }) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return (
      <p
        className="px-4 py-3 text-sm text-zinc-500"
        style={{ minHeight: MIN_HEIGHT }}
      >
        Nothing to preview yet.
      </p>
    );
  }
  return (
    <div
      className="markdown-preview px-4 py-3"
      style={{ minHeight: MIN_HEIGHT }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
    </div>
  );
}
