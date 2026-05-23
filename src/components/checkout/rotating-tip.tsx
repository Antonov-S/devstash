"use client";

import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";

import { PRO_TIPS } from "@/lib/constants";

export function RotatingTip() {
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    const index = Math.floor(Math.random() * PRO_TIPS.length);
    setTip(PRO_TIPS[index]);
  }, []);

  return (
    <div
      className="flex w-full items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-left text-sm"
      role="note"
      aria-label="Tip"
    >
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          What&apos;s next
        </span>
        <span className="text-foreground" aria-live="polite">
          {tip ?? PRO_TIPS[0]}
        </span>
      </div>
    </div>
  );
}
