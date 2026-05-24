import { redirect } from "next/navigation";
import { PartyPopper } from "lucide-react";

import { auth } from "@/auth";
import { ConfettiBurst } from "@/components/checkout/confetti-burst";
import { OnboardingChecklist } from "@/components/checkout/onboarding-checklist";
import { QuickStartShortcuts } from "@/components/checkout/quick-start-shortcuts";
import { RotatingTip } from "@/components/checkout/rotating-tip";
import { WelcomeCtaGroup } from "@/components/checkout/welcome-cta-group";

export const dynamic = "force-dynamic";

export const metadata = { title: "Welcome to Pro · DevStash" };

function firstName(name: string | null | undefined) {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0];
}

export default async function CheckoutSuccessPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/checkout/success");
  }

  const greeting = firstName(session.user.name);
  const heading = greeting ? `Welcome to Pro, ${greeting}!` : "Welcome to Pro!";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <ConfettiBurst />
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl border border-border bg-card p-6 text-center sm:p-10">
        <span
          className="flex size-14 items-center justify-center rounded-full bg-primary/10"
          aria-hidden
        >
          <PartyPopper className="size-6 text-primary" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">{heading}</h1>
          <p className="text-sm text-muted-foreground">
            Your subscription is active — you now have unlimited items and
            collections. Take a few quick steps to make the most of it.
          </p>
        </div>
        <OnboardingChecklist />
        <QuickStartShortcuts />
        <WelcomeCtaGroup />
        <RotatingTip />
      </div>
    </div>
  );
}
