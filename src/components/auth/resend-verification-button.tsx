"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMAIL_REGEX } from "@/lib/auth-constants";

export function ResendVerificationButton({
  initialEmail,
  requireInput = false
}: {
  initialEmail?: string;
  requireInput?: boolean;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [isPending, startTransition] = useTransition();
  const showInput = requireInput || !initialEmail;

  function handleClick() {
    const value = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(value)) {
      toast.error("Enter a valid email address");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/resend-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: value })
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          toast.error(data?.error ?? "Could not send the email. Try again.");
          return;
        }

        toast.success("If that email is registered, a new link is on its way.");
      } catch {
        toast.error("Network error. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {showInput ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="resend-email">Email</Label>
          <Input
            id="resend-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>
      ) : null}
      <Button
        type="button"
        size="lg"
        variant={requireInput ? "default" : "outline"}
        className="w-full"
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "Sending…" : "Resend verification email"}
      </Button>
    </div>
  );
}
