"use client";

import { Code, Sparkles, Upload, Wand2 } from "lucide-react";

import { NewItemDialog } from "@/components/items/new-item-dialog";
import { cn } from "@/lib/utils";

const triggerClass =
  "flex h-full w-full min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-3 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function QuickStartShortcuts() {
  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
      <NewItemDialog
        initialType="snippet"
        trigger={
          <button
            type="button"
            aria-label="New Snippet"
            className={triggerClass}
          >
            <Code className="size-5 text-[#3b82f6]" aria-hidden />
            <span>New Snippet</span>
          </button>
        }
      />
      <NewItemDialog
        initialType="prompt"
        trigger={
          <button
            type="button"
            aria-label="New Prompt"
            className={triggerClass}
          >
            <Sparkles className="size-5 text-[#8b5cf6]" aria-hidden />
            <span>New Prompt</span>
          </button>
        }
      />
      <NewItemDialog
        initialType="file"
        trigger={
          <button
            type="button"
            aria-label="Upload File"
            className={triggerClass}
          >
            <Upload className="size-5 text-[#6b7280]" aria-hidden />
            <span>Upload File</span>
          </button>
        }
      />
      <button
        type="button"
        disabled
        aria-disabled
        aria-label="Try AI tagging — coming soon"
        title="Coming soon"
        className={cn(
          triggerClass,
          "cursor-not-allowed opacity-60 hover:border-border hover:bg-background"
        )}
      >
        <Wand2 className="size-5 text-primary" aria-hidden />
        <span>Try AI Tagging</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Coming soon
        </span>
      </button>
    </div>
  );
}
