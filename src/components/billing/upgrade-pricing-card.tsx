"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { createCheckoutSessionAction } from "@/actions/billing";
import { BillingPeriodToggle } from "@/components/billing/billing-period-toggle";
import { PendingButton } from "@/components/ui/pending-button";
import { PRO_FEATURES, PRO_PRICE, type PricingPeriod } from "@/lib/constants";
import { cn } from "@/lib/utils";

function CheckIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0"
      style={{ color: "#4ade80" }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0 text-muted-foreground"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const FREE_FEATURES: { label: string; icon: "check" | "x"; muted?: boolean }[] = [
  { label: "50 items total", icon: "check" },
  { label: "3 collections", icon: "check" },
  { label: "Snippets, Prompts, Commands, Notes, Links", icon: "check" },
  { label: "Basic search", icon: "check" },
  { label: "File & image uploads", icon: "x", muted: true },
  { label: "AI features", icon: "x", muted: true }
];

export function UpgradePricingCard() {
  const [billing, setBilling] = useState<PricingPeriod>("monthly");
  const [pending, startTransition] = useTransition();
  const pro = PRO_PRICE[billing];

  function handleUpgrade() {
    startTransition(async () => {
      const result = await createCheckoutSessionAction(billing);
      if (result?.error) {
        toast.error(result.error);
      }
      // On success the action redirect()s and this code never runs.
    });
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        role="tablist"
        aria-label="Billing period"
        className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1"
      >
        <BillingPeriodToggle value={billing} onChange={setBilling} />
      </div>

      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 text-left sm:grid-cols-2">
        <article className="flex flex-col gap-4.5 rounded-2xl border border-border bg-card p-7">
          <header>
            <h2 className="m-0 mb-1 text-xl font-semibold">Free</h2>
            <p className="m-0 text-sm text-muted-foreground">
              Your current plan
            </p>
          </header>

          <div className="flex items-baseline gap-2">
            <span className="text-[44px] font-bold leading-none tracking-tight">
              $0
            </span>
            <span className="text-sm text-muted-foreground">forever</span>
          </div>

          <ul className="flex flex-col gap-2.5">
            {FREE_FEATURES.map((row) => (
              <li
                key={row.label}
                className={cn(
                  "flex items-center gap-2.5 text-sm",
                  row.muted && "text-muted-foreground"
                )}
              >
                {row.icon === "check" ? <CheckIcon /> : <XIcon />}
                {row.label}
              </li>
            ))}
          </ul>

          <div className="mt-auto inline-flex h-9 w-full items-center justify-center rounded-lg border border-border bg-muted/40 text-sm font-medium text-muted-foreground">
            Current plan
          </div>
        </article>

        <article
          className="relative flex flex-col gap-4.5 rounded-2xl border bg-card p-7"
          style={{
            borderColor: "color-mix(in srgb, var(--primary) 50%, var(--border))",
            background:
              "radial-gradient(600px 300px at 50% -50%, rgba(59, 130, 246, 0.16), transparent 70%), var(--card)",
            boxShadow:
              "0 0 0 1px rgba(59, 130, 246, 0.1), 0 8px 30px rgba(0,0,0,0.35)"
          }}
        >
          <span
            className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white"
            style={{
              background: "linear-gradient(135deg, #60a5fa, #3b82f6)"
            }}
          >
            Most Popular
          </span>

          <header>
            <h2 className="m-0 mb-1 text-xl font-semibold">Pro</h2>
            <p className="m-0 text-sm text-muted-foreground">
              For developers who save everything
            </p>
          </header>

          <div className="flex items-baseline gap-2">
            <span className="text-[44px] font-bold leading-none tracking-tight">
              {pro.amount}
            </span>
            <span className="text-sm text-muted-foreground">{pro.period}</span>
          </div>
          <p className="-mt-3 text-[13px] text-muted-foreground">{pro.note}</p>

          <ul className="flex flex-col gap-2.5">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm">
                <CheckIcon />
                {feature}
              </li>
            ))}
          </ul>

          <PendingButton
            type="button"
            size="lg"
            className="mt-auto w-full"
            pending={pending}
            icon={<Sparkles aria-hidden />}
            onClick={handleUpgrade}
          >
            {billing === "monthly" ? "Upgrade — $8/mo" : "Upgrade — $72/yr"}
          </PendingButton>
        </article>
      </div>
    </div>
  );
}
