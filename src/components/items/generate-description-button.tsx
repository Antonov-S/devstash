"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  generateDescription,
  type GenerateDescriptionPayload
} from "@/actions/ai-description";
import { useIsPro } from "@/components/billing/is-pro-context";

type Props = {
  getPayload: () => GenerateDescriptionPayload;
  onResult: (description: string) => void;
  disabled?: boolean;
};

export function GenerateDescriptionButton({
  getPayload,
  onResult,
  disabled
}: Props) {
  const isPro = useIsPro();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!isPro) return null;

  function handleClick() {
    const payload = getPayload();
    startTransition(async () => {
      const result = await generateDescription(payload);
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
      onResult(result.description);
      toast.success("Description generated");
    });
  }

  // Uses AI_ACCENT_COLOR (#3b82f6 / SYSTEM_TYPE_COLORS.snippet) — matches the
  // homepage hero gradient and the unified styling on SuggestTagsButton.
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || disabled}
      aria-label="Generate description with AI"
      title="Generate description with AI"
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#3b82f6] transition-colors outline-none hover:bg-[#3b82f6]/10 focus-visible:bg-[#3b82f6]/10 focus-visible:ring-2 focus-visible:ring-[#3b82f6]/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
    >
      {pending ? (
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Sparkles className="size-3.5" aria-hidden />
      )}
      <span>{pending ? "Generating…" : "Generate"}</span>
    </button>
  );
}
