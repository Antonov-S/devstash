"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { PendingButton } from "@/components/ui/pending-button";
import { credentialsSignInAction } from "@/actions/auth";
import { GithubSignInForm } from "@/components/auth/github-sign-in";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { EmailField, PasswordField } from "@/components/auth/fields";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <PendingButton
      pending={pending}
      type="submit"
      size="lg"
      className="h-11 w-full text-sm font-medium"
    >
      Sign in
    </PendingButton>
  );
}

export function SignInForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useActionState(credentialsSignInAction, undefined);
  const lastToastedError = useRef<string | null>(null);

  useEffect(() => {
    if (state?.code === "rate_limited" && state.error) {
      if (lastToastedError.current !== state.error) {
        toast.error(state.error);
        lastToastedError.current = state.error;
      }
    } else {
      lastToastedError.current = null;
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        {callbackUrl ? (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <EmailField
            id="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordField
            id="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </div>

        {state?.error ? (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <p>{state.error}</p>
            {state.code === "email_not_verified" ? (
              <ResendVerificationButton initialEmail={state.email} />
            ) : null}
          </div>
        ) : null}

        <SubmitButton />
      </form>

      <GithubSignInForm callbackUrl={callbackUrl} />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
