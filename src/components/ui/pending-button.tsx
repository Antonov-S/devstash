import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type PendingButtonProps = React.ComponentProps<typeof Button> & {
  pending: boolean;
  /** Optional non-spinner icon shown when not pending. */
  icon?: React.ReactNode;
};

export function PendingButton({
  pending,
  icon,
  disabled,
  children,
  ...props
}: PendingButtonProps) {
  return (
    <Button {...props} disabled={pending || disabled}>
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : (
        icon
      )}
      {children}
    </Button>
  );
}
