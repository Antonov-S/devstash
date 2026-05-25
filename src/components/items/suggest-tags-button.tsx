"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import {
  generateAutoTags,
  type GenerateAutoTagsPayload
} from "@/actions/ai-tags";
import { useIsPro } from "@/components/billing/is-pro-context";
import { Button } from "@/components/ui/button";
import { PendingButton } from "@/components/ui/pending-button";

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
  const isPro = useIsPro();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  if (!isPro) return null;

  const existingSet = new Set(
    existingTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)
  );

  function handleSuggest() {
    const payload = getPayload();
    startTransition(async () => {
      const result = await generateAutoTags(payload);
      if (!result.success) {
        if (result.error.includes("Pro")) {
          toast.error(result.error, {
            action: {
              label: "Upgrade",
              onClick: () => router.push("/upgrade")
            }
          });
        } else {
          toast.error(result.error);
        }
        return;
      }
      const fresh = result.tags.filter((tag) => !existingSet.has(tag));
      if (fresh.length === 0) {
        toast.message("No new tags to suggest.");
        setSuggestions([]);
        return;
      }
      setSuggestions(fresh);
    });
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
        <PendingButton
          type="button"
          variant="ghost"
          size="sm"
          pending={pending}
          disabled={disabled}
          onClick={handleSuggest}
          icon={<Sparkles aria-hidden className="size-4" />}
        >
          {pending ? "Suggesting…" : "Suggest tags"}
        </PendingButton>
      </div>
      {suggestions.length > 0 && (
        <ul
          className="flex flex-wrap gap-1.5"
          aria-label="Suggested tags"
        >
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
