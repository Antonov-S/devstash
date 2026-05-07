"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { credentialsSignInAction, githubSignInAction } from "@/actions/auth";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : children}
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
      className="w-full"
      disabled={pending}
    >
      {pending ? "Redirecting…" : "Sign in with GitHub"}
    </Button>
  );
}

export function SignInForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useActionState(credentialsSignInAction, undefined);

  return (
    <div className="flex flex-col gap-6">
      <form action={githubSignInAction}>
        {callbackUrl ? (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        ) : null}
        <GithubButton />
      </form>

      <div className="relative text-center text-xs text-muted-foreground">
        <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
        <span className="bg-background px-2 uppercase tracking-wider">
          Or continue with
        </span>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {callbackUrl ? (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
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

        <SubmitButton>Sign in</SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
