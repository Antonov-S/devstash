import { toast } from "sonner";

/**
 * Show an error toast for a failed server action. When the error is a Pro-gated
 * rejection (the action's error string contains "Pro") and an `onUpgrade`
 * handler is supplied, the toast gains an "Upgrade" action button. Otherwise it
 * falls back to a plain error toast.
 *
 * The navigation is left to the caller via `onUpgrade` because destinations
 * differ across surfaces (`/upgrade` vs `/settings#billing`, `router.push` vs
 * `window.location.assign`).
 */
export function toastActionError(error: string, onUpgrade?: () => void) {
  if (onUpgrade && error.includes("Pro")) {
    toast.error(error, {
      action: { label: "Upgrade", onClick: onUpgrade }
    });
    return;
  }
  toast.error(error);
}
