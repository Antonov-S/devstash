"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { NewItemDialog } from "@/components/items/new-item-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WelcomeCtaGroup() {
  return (
    <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
      <NewItemDialog
        initialType="snippet"
        trigger={
          <button
            type="button"
            className={cn(buttonVariants({ variant: "default" }), "gap-2")}
          >
            <Plus className="size-4" aria-hidden />
            Start adding items
          </button>
        }
      />
      <Link
        href="/dashboard"
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        Go to Dashboard
      </Link>
      <Link
        href="/settings#billing"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Manage subscription
      </Link>
    </div>
  );
}
