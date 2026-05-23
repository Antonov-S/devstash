"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

const DEFAULT_TITLE = "Upgrade to Pro";
const DEFAULT_DESCRIPTION =
  "You've hit a Free plan limit. Upgrade to keep going.";

const PRO_FEATURES = [
  "Unlimited items and collections",
  "File & image uploads",
  "AI auto-tagging, summaries, and code explain",
  "Export as JSON or ZIP"
];

export function UpgradePromptDialog({
  open,
  onOpenChange,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-2 text-sm">
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

        <DialogFooter className="pt-2">
          <DialogClose
            render={
              <Button type="button" variant="outline">
                Cancel
              </Button>
            }
          />
          <Link
            href="/settings#billing"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Upgrade to Pro
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
