"use client";

import { Check, Copy, Crown, LoaderCircle, Sparkles } from "lucide-react";

import { useIsPro } from "@/components/billing/is-pro-context";
import { Button } from "@/components/ui/button";
import { AI_ACCENT_COLOR } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Shared height bounds for the in-app editors (Monaco code editor + markdown
// editor) and their preview panes.
export const EDITOR_MIN_HEIGHT = 80;
export const EDITOR_MAX_HEIGHT = 400;

// Pill tab button used in both editor headers. `icon` is optional — the code
// editor's Code/Explain tabs render label-only, the markdown editor's tabs
// render an icon + label.
export function EditorTabButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
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

// Copy-to-clipboard button with the Copy → Check swap. Copy state + handler stay
// in each editor (they copy different content).
export function EditorCopyButton({
  copied,
  onCopy,
  ariaLabel
}: {
  copied: boolean;
  onCopy: () => void;
  ariaLabel: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onCopy}
      aria-label={ariaLabel}
      className="text-muted-foreground hover:text-foreground"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-400" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
    </Button>
  );
}

// Pro-gated AI button shared by the editors: Pro users get an accent Sparkles
// (spinner while pending); free users get a disabled Crown with the upgrade
// tooltip. The editor stays responsible for gating whether this renders at all.
export function EditorAiButton({
  pending,
  disabled,
  onClick,
  ariaLabel
}: {
  pending: boolean;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  const isPro = useIsPro();

  if (isPro) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        title={ariaLabel}
        className="hover:bg-transparent"
        style={{ color: AI_ACCENT_COLOR }}
      >
        {pending ? (
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="size-3.5" aria-hidden />
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled
      aria-label="AI features require Pro subscription"
      title="AI features require Pro subscription"
      className="cursor-not-allowed text-muted-foreground opacity-70 disabled:opacity-70"
    >
      <Crown className="size-3.5" aria-hidden />
    </Button>
  );
}
