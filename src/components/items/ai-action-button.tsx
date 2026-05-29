"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { useIsPro } from "@/components/billing/is-pro-context";
import { toastActionError } from "@/lib/toast-error";

type AiActionResult = { success: true } | { success: false; error: string };

// Shared plumbing for the Pro-gated AI buttons (suggest tags, generate
// description). Owns the Pro flag, the pending transition, and the
// failure-toast-with-upgrade behavior. Each consumer supplies its own bound
// action + success handler.
export function useAiAction() {
  const isPro = useIsPro();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run<R extends AiActionResult>(
    action: () => Promise<R>,
    onSuccess: (result: Extract<R, { success: true }>) => void
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        onSuccess(result as Extract<R, { success: true }>);
      } else {
        toastActionError(result.error, () => router.push("/upgrade"));
      }
    });
  }

  return { isPro, pending, run };
}

// The byte-identical accent button shell shared by both AI buttons. Uses
// AI_ACCENT_COLOR (#3b82f6 / SYSTEM_TYPE_COLORS.snippet) so both AI affordances
// read as a unified set.
export function AiActionButton({
  onClick,
  pending,
  idleLabel,
  pendingLabel,
  ariaLabel,
  disabled
}: {
  onClick: () => void;
  pending: boolean;
  idleLabel: string;
  pendingLabel: string;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending || disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#3b82f6] transition-colors outline-none hover:bg-[#3b82f6]/10 focus-visible:bg-[#3b82f6]/10 focus-visible:ring-2 focus-visible:ring-[#3b82f6]/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
    >
      {pending ? (
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Sparkles className="size-3.5" aria-hidden />
      )}
      <span>{pending ? pendingLabel : idleLabel}</span>
    </button>
  );
}
