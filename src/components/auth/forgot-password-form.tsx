"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMAIL_REGEX } from "@/lib/auth-constants";

type Status = "idle" | "sent" | "error";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(value)) {
      setStatus("error");
      setErrorMessage("Enter a valid email address");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: value })
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          const message =
            data?.error ?? "Could not send reset email. Try again.";
          if (res.status === 429) toast.error(message);
          setStatus("error");
          setErrorMessage(message);
          return;
        }

        setStatus("sent");
      } catch {
        setStatus("error");
        setErrorMessage("Network error. Please try again.");
      }
    });
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          If an account exists for{" "}
          <span className="font-medium text-foreground">{email}</span>, we just
          sent a password-reset link. The link expires in 1 hour.
        </div>
        <p className="text-xs text-muted-foreground">
          Didn&apos;t get the email? Check your spam folder, or try again with
          a different address.
        </p>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="w-full"
          onClick={() => {
            setStatus("idle");
            setErrorMessage(null);
          }}
        >
          Try a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={status === "error" ? true : undefined}
          placeholder="you@example.com"
        />
      </div>

      <FormError>{status === "error" ? errorMessage : null}</FormError>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
