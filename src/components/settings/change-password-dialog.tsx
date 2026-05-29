"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldError, FormError } from "@/components/ui/form-error";
import { PendingButton } from "@/components/ui/pending-button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/fields";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-constants";

type FieldErrors = Partial<
  Record<"currentPassword" | "newPassword" | "confirmPassword" | "form", string>
>;

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  function reset() {
    setErrors({});
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    setOpen(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    const fieldErrors: FieldErrors = {};
    if (!currentPassword)
      fieldErrors.currentPassword = "Current password is required";
    if (!newPassword) fieldErrors.newPassword = "New password is required";
    else if (newPassword.length < MIN_PASSWORD_LENGTH)
      fieldErrors.newPassword = `Must be at least ${MIN_PASSWORD_LENGTH} characters`;
    if (!confirmPassword)
      fieldErrors.confirmPassword = "Please confirm your new password";
    else if (newPassword && confirmPassword !== newPassword)
      fieldErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    startTransition(async () => {
      try {
        const res = await fetch("/api/account/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          setErrors({
            form: body?.error ?? "Could not update your password. Try again."
          });
          return;
        }

        form.reset();
        setOpen(false);
        toast.success("Password updated");
      } catch {
        setErrors({ form: "Network error. Please try again." });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <KeyRound aria-hidden />
            Change password
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
          aria-busy={isPending}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <PasswordField
              id="currentPassword"
              name="currentPassword"
              autoComplete="current-password"
              required
              aria-invalid={errors.currentPassword ? true : undefined}
              placeholder="••••••••"
            />
            <FieldError message={errors.currentPassword} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <PasswordField
              id="newPassword"
              name="newPassword"
              autoComplete="new-password"
              required
              aria-invalid={errors.newPassword ? true : undefined}
              placeholder="At least 8 characters"
            />
            <FieldError message={errors.newPassword} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <PasswordField
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              aria-invalid={errors.confirmPassword ? true : undefined}
              placeholder="Repeat your new password"
            />
            <FieldError message={errors.confirmPassword} />
          </div>

          <FormError>{errors.form}</FormError>

          <DialogFooter className="pt-2">
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              }
            />
            <PendingButton type="submit" pending={isPending}>
              Update password
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
