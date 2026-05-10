"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { credentialsSignInAction, githubSignInAction } from "@/actions/auth";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { EmailField, PasswordField } from "@/components/auth/fields";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.13c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="h-11 w-full text-sm font-medium"
      disabled={pending}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : null}
      Sign in
    </Button>
  );
}

function GithubButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      variant="outline"
      className="h-11 w-full gap-2 text-sm font-medium"
      disabled={pending}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : (
        <GithubIcon className="size-4" />
      )}
      GitHub
    </Button>
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

      <div className="relative text-center text-xs text-muted-foreground">
        <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
        <span className="bg-card px-2 uppercase tracking-wider">
          Or continue with
        </span>
      </div>

      <form action={githubSignInAction}>
        {callbackUrl ? (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        ) : null}
        <GithubButton />
      </form>

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
