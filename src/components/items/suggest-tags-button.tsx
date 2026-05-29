"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import {
  generateAutoTags,
  type GenerateAutoTagsPayload
} from "@/actions/ai-tags";
import {
  AiActionButton,
  useAiAction
} from "@/components/items/ai-action-button";
import { Button } from "@/components/ui/button";

type Props = {
  getPayload: () => GenerateAutoTagsPayload;
  existingTags: string[];
  onAccept: (tag: string) => void;
  disabled?: boolean;
};

export function SuggestTagsButton({
  getPayload,
  existingTags,
  onAccept,
  disabled
}: Props) {
  const { isPro, pending, run } = useAiAction();
  const [suggestions, setSuggestions] = useState<string[]>([]);

  if (!isPro) return null;

  const existingSet = new Set(
    existingTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)
  );

  function handleSuggest() {
    const payload = getPayload();
    run(
      () => generateAutoTags(payload),
      (result) => {
        const fresh = result.tags.filter((tag) => !existingSet.has(tag));
        if (fresh.length === 0) {
          toast.message("No new tags to suggest.");
          setSuggestions([]);
          return;
        }
        setSuggestions(fresh);
      }
    );
  }

  function handleAccept(tag: string) {
    onAccept(tag);
    setSuggestions((current) => current.filter((other) => other !== tag));
  }

  function handleReject(tag: string) {
    setSuggestions((current) => current.filter((other) => other !== tag));
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <AiActionButton
          onClick={handleSuggest}
          pending={pending}
          idleLabel="Suggest tags"
          pendingLabel="Suggesting…"
          ariaLabel="Suggest tags with AI"
          disabled={disabled}
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Suggested tags">
          {suggestions.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 py-0.5 pl-2.5 pr-1 text-xs"
            >
              <span className="font-medium">{tag}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-5 rounded-full text-muted-foreground hover:text-foreground"
                aria-label={`Add tag ${tag}`}
                onClick={() => handleAccept(tag)}
              >
                <Check className="size-3" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-5 rounded-full text-muted-foreground hover:text-foreground"
                aria-label={`Reject tag ${tag}`}
                onClick={() => handleReject(tag)}
              >
                <X className="size-3" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
