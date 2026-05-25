"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import {
  generateAutoTags,
  type GenerateAutoTagsPayload
} from "@/actions/ai-tags";
import { useIsPro } from "@/components/billing/is-pro-context";
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
        {/* Uses AI_ACCENT_COLOR (#3b82f6 / SYSTEM_TYPE_COLORS.snippet) — matches
            GenerateDescriptionButton so both AI buttons read as a unified set. */}
        <button
          type="button"
          onClick={handleSuggest}
          disabled={pending || disabled}
          aria-label="Suggest tags with AI"
          title="Suggest tags with AI"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#3b82f6] transition-colors outline-none hover:bg-[#3b82f6]/10 focus-visible:bg-[#3b82f6]/10 focus-visible:ring-2 focus-visible:ring-[#3b82f6]/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
        >
          {pending ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-3.5" aria-hidden />
          )}
          <span>{pending ? "Suggesting…" : "Suggest tags"}</span>
        </button>
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
