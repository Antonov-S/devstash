"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ToggleActionResult = { success: true } | { success: false; error: string };

// Optimistic boolean toggle backed by a server action. Sets the new value
// immediately, runs the action in a transition, rolls back + toasts on failure,
// and router.refresh()es on success. Re-syncs from `initial` when the parent
// passes a new value after a refresh.
export function useOptimisticToggle({
  initial,
  action
}: {
  initial: boolean;
  action: (next: boolean) => Promise<ToggleActionResult>;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  function set(next: boolean) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      const result = await action(next);
      if (!result.success) {
        setValue(previous);
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function toggle() {
    set(!value);
  }

  return { value, pending, set, toggle };
}
