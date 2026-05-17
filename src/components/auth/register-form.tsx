"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  EmailField,
  IconField,
  PasswordField
} from "@/components/auth/fields";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

type FieldErrors = Partial<
  Record<"name" | "email" | "password" | "confirmPassword" | "form", string>
>;

function FieldError({ message }: { message?: string }) {
  return (
    <p
      className="min-h-4 text-xs leading-4 text-destructive"
      aria-live="polite"
    >
      {message ?? " "}
    </p>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  function validate(form: HTMLFormElement): {
    values: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    };
    fieldErrors: FieldErrors;
  } {
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    const fieldErrors: FieldErrors = {};
    if (!name) fieldErrors.name = "Name is required";
    if (!email) fieldErrors.email = "Email is required";
    else if (!EMAIL_REGEX.test(email))
      fieldErrors.email = "Enter a valid email address";
    if (!password) fieldErrors.password = "Password is required";
    else if (password.length < MIN_PASSWORD_LENGTH)
      fieldErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    if (!confirmPassword)
      fieldErrors.confirmPassword = "Please confirm your password";
    else if (password && confirmPassword !== password)
      fieldErrors.confirmPassword = "Passwords do not match";

    return {
      values: { name, email, password, confirmPassword },
      fieldErrors
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const { values, fieldErrors } = validate(form);

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            password: values.password
          })
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          const message =
            data?.error ?? "Could not create account. Please try again.";
          if (res.status === 429) toast.error(message);
          setErrors({ form: message });
          return;
        }

        const target = new URL("/verify-email", window.location.origin);
        target.searchParams.set("email", values.email.toLowerCase());
        router.push(`${target.pathname}${target.search}`);
      } catch {
        setErrors({ form: "Network error. Please try again." });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
      aria-busy={isPending}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <IconField
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          aria-invalid={errors.name ? true : undefined}
          placeholder="Your name"
          icon={<User className="size-4" />}
        />
        <FieldError message={errors.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <EmailField
          id="email"
          name="email"
          autoComplete="email"
          required
          aria-invalid={errors.email ? true : undefined}
          placeholder="you@example.com"
        />
        <FieldError message={errors.email} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <PasswordField
          id="password"
          name="password"
          autoComplete="new-password"
          required
          aria-invalid={errors.password ? true : undefined}
          placeholder="At least 8 characters"
        />
        <FieldError message={errors.password} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          aria-invalid={errors.confirmPassword ? true : undefined}
          placeholder="Repeat your password"
        />
        <FieldError message={errors.confirmPassword} />
      </div>

      {errors.form ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errors.form}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full text-sm font-medium"
        disabled={isPending}
      >
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : null}
        Create account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
