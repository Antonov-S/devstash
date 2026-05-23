"use client";

import { useTransition } from "react";
import { CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  createCheckoutSessionAction,
  createPortalSessionAction
} from "@/actions/billing";
import { PendingButton } from "@/components/ui/pending-button";

type Props = {
  isPro: boolean;
};

export function BillingCard({ isPro }: Props) {
  const [pendingMonthly, startMonthly] = useTransition();
  const [pendingYearly, startYearly] = useTransition();
  const [pendingPortal, startPortal] = useTransition();

  function handleUpgrade(period: "monthly" | "yearly") {
    const start = period === "monthly" ? startMonthly : startYearly;
    start(async () => {
      const result = await createCheckoutSessionAction(period);
      if (result?.error) {
        toast.error(result.error);
      }
      // On success the action redirect()s and this code never runs.
    });
  }

  function handleManage() {
    startPortal(async () => {
      const result = await createPortalSessionAction();
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  if (isPro) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-border p-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">Pro plan</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage your subscription, payment method, and invoices in the
            Stripe portal.
          </p>
        </div>
        <PendingButton
          type="button"
          variant="outline"
          size="sm"
          pending={pendingPortal}
          icon={<CreditCard aria-hidden />}
          onClick={handleManage}
        >
          Manage subscription
        </PendingButton>
      </div>
    );
  }

  const anyPending = pendingMonthly || pendingYearly;

  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-border p-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">Free plan</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Limited to 50 items and 3 collections. Upgrade to Pro for unlimited
          items, file &amp; image uploads, and AI features.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <PendingButton
          type="button"
          size="sm"
          pending={pendingMonthly}
          disabled={anyPending}
          icon={<Sparkles aria-hidden />}
          onClick={() => handleUpgrade("monthly")}
        >
          Upgrade — $8/mo
        </PendingButton>
        <PendingButton
          type="button"
          variant="outline"
          size="sm"
          pending={pendingYearly}
          disabled={anyPending}
          onClick={() => handleUpgrade("yearly")}
        >
          Upgrade — $72/yr
        </PendingButton>
      </div>
    </div>
  );
}
