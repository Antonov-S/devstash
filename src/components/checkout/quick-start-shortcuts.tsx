"use client";

import Link from "next/link";
import { Image as ImageIcon, Upload, Wand2 } from "lucide-react";

import { NewItemDialog } from "@/components/items/new-item-dialog";

const triggerClass =
  "flex h-full w-full min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-3 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function QuickStartShortcuts() {
  return (
    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
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
      <NewItemDialog
        initialType="image"
        trigger={
          <button
            type="button"
            aria-label="Upload Image"
            className={triggerClass}
          >
            <ImageIcon className="size-5 text-[#ec4899]" aria-hidden />
            <span>Upload Image</span>
          </button>
        }
      />
      <Link href="/ai-tagging" aria-label="Try AI Tagging" className={triggerClass}>
        <Wand2 className="size-5 text-primary" aria-hidden />
        <span>Try AI Tagging</span>
      </Link>
    </div>
  );
}
