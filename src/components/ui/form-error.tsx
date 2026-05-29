import { cn } from "@/lib/utils";

// Shared destructive-alert classes for form-level error blocks. Exported so the
// sign-in alert (which wraps a resend button and needs its own flex layout) can
// reuse the same color/border treatment without duplicating the string.
export const formErrorClass =
  "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive";

// Form-level error alert. Renders null when there's no message, so callers can
// drop the surrounding `message ? (...) : null` ternary.
export function FormError({
  children,
  className
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p role="alert" className={cn(formErrorClass, className)}>
      {children}
    </p>
  );
}

// Inline, single-field error. Renders null when empty (collapses with no
// reserved height). Note: the register form uses its own reserved-height
// variant with aria-live, which is intentionally separate.
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
