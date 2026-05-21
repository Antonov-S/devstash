"use client";

import Link from "next/link";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "yearly";

type Props = {
  isAuthenticated: boolean;
};

const PRO_PRICE: Record<Billing, { amount: string; period: string; note: string }> = {
  monthly: { amount: "$8", period: "/ month", note: "Billed monthly" },
  yearly: {
    amount: "$6",
    period: "/ month, billed yearly",
    note: "$72 billed yearly"
  }
};

function Check({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckBadge() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border"
      style={{
        background: "rgba(34, 197, 94, 0.15)",
        borderColor: "rgba(34, 197, 94, 0.35)",
        color: "#4ade80"
      }}
    >
      <Check className="size-2.25" />
    </span>
  );
}

function XBadge() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
    >
      <XMark className="size-2.25" />
    </span>
  );
}

const FREE_FEATURES: { label: string; muted?: boolean; icon: "check" | "x" }[] = [
  { label: "50 items total", icon: "check" },
  { label: "3 collections", icon: "check" },
  { label: "All text item types", icon: "check" },
  { label: "Basic search", icon: "check" },
  { label: "File & image uploads", icon: "x", muted: true },
  { label: "AI features", icon: "x", muted: true }
];

export function PricingSection({ isAuthenticated }: Props) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const pro = PRO_PRICE[billing];

  // TODO: point Pro CTA at /settings#billing once billing is wired up.
  const freeHref = isAuthenticated ? "/dashboard" : "/register";
  const proHref = "/register";
  const freeLabel = isAuthenticated ? "Open dashboard" : "Start free";

  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-t border-border py-18 sm:py-25"
    >
      <div className="mx-auto max-w-300 px-6">
        <Reveal className="mx-auto mb-9 max-w-180 text-center sm:mb-14">
          <span className="mb-4.5 inline-block rounded-full border border-border bg-card px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            Pricing
          </span>
          <h2 className="my-1 text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.15] tracking-tight">
            Free to start, easy to scale
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Use DevStash forever on the free plan. Upgrade when you need
            unlimited items and AI.
          </p>
        </Reveal>

        <div className="mb-10 flex justify-center">
          <Reveal
            as="div"
            role="tablist"
            aria-label="Billing period"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={billing === "monthly"}
              onClick={() => setBilling("monthly")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-sm font-medium transition-colors",
                billing === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={billing === "yearly"}
              onClick={() => setBilling("yearly")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-sm font-medium transition-colors",
                billing === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yearly
              <span
                className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                style={
                  billing === "yearly"
                    ? {
                        background: "rgba(255, 255, 255, 0.22)",
                        color: "#fff",
                        borderColor: "rgba(255, 255, 255, 0.3)"
                      }
                    : {
                        background: "rgba(34, 197, 94, 0.2)",
                        color: "#4ade80",
                        borderColor: "rgba(34, 197, 94, 0.4)"
                      }
                }
              >
                Save 25%
              </span>
            </button>
          </Reveal>
        </div>

        <div className="mx-auto grid max-w-220 grid-cols-1 gap-6 sm:grid-cols-2">
          <Reveal
            as="article"
            className="flex flex-col gap-4.5 rounded-2xl border border-border bg-card p-7"
          >
            <header>
              <h3 className="m-0 mb-1 text-xl font-semibold">Free</h3>
              <p className="m-0 text-sm text-muted-foreground">
                Perfect for getting started
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
                  {row.icon === "check" ? <CheckBadge /> : <XBadge />}
                  {row.label}
                </li>
              ))}
            </ul>
            <Link
              href={freeHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full"
              )}
            >
              {freeLabel}
            </Link>
          </Reveal>

          <Reveal
            as="article"
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
                background: "linear-gradient(135deg, #3b82f6, #6366f1)"
              }}
            >
              Most Popular
            </span>
            <header>
              <h3 className="m-0 mb-1 text-xl font-semibold">Pro</h3>
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
            <p className="-mt-2.5 text-[13px] text-muted-foreground">
              {pro.note}
            </p>
            <ul className="flex flex-col gap-2.5">
              <li className="flex items-center gap-2.5 text-sm">
                <CheckBadge />
                <span>
                  <strong>Unlimited</strong> items & collections
                </span>
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <CheckBadge />
                File & image uploads
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <CheckBadge />
                AI auto-tagging & summaries
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <CheckBadge />
                Explain code & prompt optimizer
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <CheckBadge />
                Export as JSON or ZIP
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <CheckBadge />
                Priority support
              </li>
            </ul>
            <Link
              href={proHref}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "w-full"
              )}
            >
              Upgrade to Pro
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
