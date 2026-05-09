import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { peekPasswordResetToken } from "@/lib/verification-token";

type SearchParams = Promise<{ token?: string | string[] }>;

export const metadata = {
  title: "Reset password · DevStash"
};

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const token = pickFirst(params.token);

  if (!token) {
    return <InvalidState />;
  }

  const result = await peekPasswordResetToken(token);

  if (!result.ok) {
    return result.reason === "expired" ? <ExpiredState /> : <InvalidState />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Choose a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Setting a new password for{" "}
          <span className="font-medium text-foreground">{result.email}</span>.
        </p>
      </div>

      <ResetPasswordForm token={token} />

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

function ExpiredState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Link expired</h1>
        <p className="text-sm text-muted-foreground">
          This password-reset link has expired. Request a new one to continue.
        </p>
      </div>
      <Link
        href="/forgot-password"
        className={buttonVariants({ size: "lg", className: "w-full" })}
      >
        Request a new link
      </Link>
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

function InvalidState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Invalid reset link
        </h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t use this link. It may have already been used or be
          incorrect. Request a fresh one to continue.
        </p>
      </div>
      <Link
        href="/forgot-password"
        className={buttonVariants({ size: "lg", className: "w-full" })}
      >
        Request a new link
      </Link>
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
