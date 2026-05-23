import Link from "next/link";
import { redirect } from "next/navigation";
import { PartyPopper, Sparkles } from "lucide-react";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { PRO_FEATURES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Welcome to Pro · DevStash" };

export default async function CheckoutSuccessPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/checkout/success");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl border border-border bg-card p-10 text-center">
        <span
          className="flex size-14 items-center justify-center rounded-full bg-primary/10"
          aria-hidden
        >
          <PartyPopper className="size-6 text-primary" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Welcome to Pro!</h1>
          <p className="text-sm text-muted-foreground">
            Your subscription is active. Here&apos;s what you&apos;ve unlocked:
          </p>
        </div>
        <ul className="flex w-full flex-col gap-2 text-left text-sm">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Sparkles
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-primary"
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/settings#billing"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Manage subscription
          </Link>
        </div>
      </div>
    </div>
  );
}
