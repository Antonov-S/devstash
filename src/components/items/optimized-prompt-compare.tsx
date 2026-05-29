"use client";

import { Check, Eye, LoaderCircle, Sparkles, X } from "lucide-react";

import { EditorTabButton } from "@/components/items/editor-chrome";
import { Button } from "@/components/ui/button";
import { AI_ACCENT_COLOR } from "@/lib/constants";

export type CompareTab = "original" | "refined";

// The two header slots shown while the markdown editor is in refined-prompt
// compare mode: the Original/Refined tablist (left) and the Discard / Use-this
// actions (right). Returns a fragment so it drops into the editor header in
// place of the normal mode tabs + AI/copy actions without changing layout.
export function OptimizedPromptCompareHeader({
  compareTab,
  onCompareTabChange,
  applyingOptimized,
  onDiscard,
  onApply
}: {
  compareTab: CompareTab;
  onCompareTabChange: (tab: CompareTab) => void;
  applyingOptimized: boolean;
  onDiscard: () => void;
  onApply: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <div
          role="tablist"
          aria-label="Original or refined prompt"
          className="flex items-center gap-0.5 rounded-md bg-[#0f0f0f] p-0.5"
        >
          <EditorTabButton
            active={compareTab === "original"}
            onClick={() => onCompareTabChange("original")}
            icon={<Eye className="size-3.5" aria-hidden />}
            label="Original"
          />
          <EditorTabButton
            active={compareTab === "refined"}
            onClick={() => onCompareTabChange("refined")}
            icon={
              <Sparkles
                className="size-3.5"
                style={{ color: AI_ACCENT_COLOR }}
                aria-hidden
              />
            }
            label="Refined"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDiscard}
          disabled={applyingOptimized}
          aria-label="Discard"
          title="Discard"
          className="h-7 flex-1 gap-1.5 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-initial sm:px-1.5"
        >
          <X className="size-3.5" aria-hidden />
          <span className="sm:hidden">Discard</span>
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onApply}
          disabled={applyingOptimized}
          className="h-7 flex-1 gap-1.5 px-2 text-white sm:flex-initial"
          style={{ backgroundColor: AI_ACCENT_COLOR }}
        >
          {applyingOptimized ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Check className="size-3.5" aria-hidden />
          )}
          Use this
        </Button>
      </div>
    </>
  );
}
