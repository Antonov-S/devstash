"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { FieldError, FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-constants";

type FieldErrors = Partial<
  Record<"password" | "confirmPassword" | "form", string>
>;

export function ResetPasswordForm({ token }: { token: string }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    const fieldErrors: FieldErrors = {};
    if (!password) fieldErrors.password = "Password is required";
    else if (password.length < MIN_PASSWORD_LENGTH)
      fieldErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    if (!confirmPassword)
      fieldErrors.confirmPassword = "Please confirm your password";
    else if (password && confirmPassword !== password)
      fieldErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password, confirmPassword })
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          const message =
            body?.error ?? "Could not reset your password. Try again.";
          if (res.status === 429) toast.error(message);
          setErrors({ form: message });
          return;
        }

        setIsSuccess(true);
      } catch {
        setErrors({ form: "Network error. Please try again." });
      }
    });
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            Password updated
          </h2>
          <p className="text-sm text-muted-foreground">
            You can now sign in with your new password.
          </p>
        </div>
        <Link
          href="/sign-in"
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
      aria-busy={isPending}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={errors.password ? true : undefined}
          placeholder="At least 8 characters"
        />
        <FieldError message={errors.password} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={errors.confirmPassword ? true : undefined}
          placeholder="Repeat your password"
        />
        <FieldError message={errors.confirmPassword} />
      </div>

      <FormError>{errors.form}</FormError>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
