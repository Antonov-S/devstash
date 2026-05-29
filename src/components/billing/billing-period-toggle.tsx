"use client";

import type { PricingPeriod } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  value: PricingPeriod;
  onChange: (next: PricingPeriod) => void;
};

/**
 * The Monthly / Yearly tab buttons (with the "Save 25%" badge) shared by the
 * marketing pricing section and the upgrade page pricing card. The caller owns
 * the `role="tablist"` container so it can choose the wrapper (e.g. a `Reveal`
 * on marketing vs a plain `div` on the upgrade page).
 */
export function BillingPeriodToggle({ value, onChange }: Props) {
  return (
    <>
      <button
        type="button"
        role="tab"
        aria-selected={value === "monthly"}
        onClick={() => onChange("monthly")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-sm font-medium transition-colors",
          value === "monthly"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "yearly"}
        onClick={() => onChange("yearly")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-sm font-medium transition-colors",
          value === "yearly"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Yearly
        <span
          className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold"
          style={
            value === "yearly"
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
    </>
  );
}
