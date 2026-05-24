import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UpgradePricingCard } from "@/components/billing/upgrade-pricing-card";

export const metadata = {
  title: "Upgrade to Pro · DevStash"
};

export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/upgrade");
  if (session.user.isPro) redirect("/settings#billing");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 py-6 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Upgrade to Pro
        </h1>
        <p className="text-base text-muted-foreground">
          Unlock unlimited items and collections, file &amp; image uploads, AI
          features, and more.
        </p>
      </div>

      <UpgradePricingCard />
    </div>
  );
}
