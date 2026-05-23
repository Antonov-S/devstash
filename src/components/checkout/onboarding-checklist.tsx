"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";

import {
  ONBOARDING_CHECKLIST_ITEMS,
  ONBOARDING_STORAGE_KEY,
  type OnboardingChecklistItemId
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type ChecklistState = Partial<Record<OnboardingChecklistItemId, boolean>>;

const VALID_IDS = new Set<string>(
  ONBOARDING_CHECKLIST_ITEMS.map((item) => item.id)
);

function readState(): ChecklistState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const next: ChecklistState = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (VALID_IDS.has(key) && value === true) {
        next[key as OnboardingChecklistItemId] = true;
      }
    }
    return next;
  } catch {
    return {};
  }
}

function writeState(state: ChecklistState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable (private mode / quota); ignore.
  }
}

export function OnboardingChecklist() {
  const [state, setState] = useState<ChecklistState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readState());
    setHydrated(true);
  }, []);

  const total = ONBOARDING_CHECKLIST_ITEMS.length;
  const completed = ONBOARDING_CHECKLIST_ITEMS.reduce(
    (sum, item) => (state[item.id] ? sum + 1 : sum),
    0
  );
  const percent = Math.round((completed / total) * 100);

  function toggle(id: OnboardingChecklistItemId) {
    setState((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) delete next[id];
      writeState(next);
      return next;
    });
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Get started</span>
        <span aria-live="polite">
          {hydrated ? completed : 0} / {total} completed
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={hydrated ? completed : 0}
        aria-label="Onboarding progress"
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${hydrated ? percent : 0}%` }}
        />
      </div>
      <ul className="flex flex-col gap-1.5">
        {ONBOARDING_CHECKLIST_ITEMS.map((item) => {
          const checked = Boolean(state[item.id]);
          const disabled = Boolean(item.comingSoon);
          return (
            <li key={item.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                aria-disabled={disabled || undefined}
                disabled={disabled}
                onClick={disabled ? undefined : () => toggle(item.id)}
                className={cn(
                  "flex w-full min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                  disabled
                    ? "cursor-not-allowed opacity-60"
                    : "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background"
                  )}
                >
                  {checked ? <Check className="size-3.5" /> : null}
                </span>
                <span
                  className={cn(
                    "flex flex-1 items-center gap-2",
                    checked && "text-muted-foreground line-through"
                  )}
                >
                  <span>{item.label}</span>
                  {disabled ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      <Sparkles className="size-2.5" aria-hidden />
                      Coming soon
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
