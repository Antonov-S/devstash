import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { PRO_FEATURES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
};

export function UpgradePromptPage({ title, description }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl border border-border bg-card p-10 text-center">
      <span
        className="flex size-14 items-center justify-center rounded-full bg-primary/10"
        aria-hidden
      >
        <Lock className="size-6 text-primary" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
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
      <Link
        href="/settings#billing"
        className={cn(buttonVariants({ variant: "default" }), "mt-2")}
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}
