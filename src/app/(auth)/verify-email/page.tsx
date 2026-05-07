import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";

type SearchParams = Promise<{
  email?: string | string[];
  status?: string | string[];
}>;

type Status = "sent" | "verified" | "expired" | "invalid";

export const metadata = {
  title: "Verify your email · DevStash"
};

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeStatus(value: string | undefined): Status {
  switch (value) {
    case "verified":
    case "expired":
    case "invalid":
      return value;
    default:
      return "sent";
  }
}

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const email = pickFirst(params.email);
  const status = normalizeStatus(pickFirst(params.status));

  if (status === "verified") {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Email verified
          </h1>
          <p className="text-sm text-muted-foreground">
            Your account is now active. You can sign in and start using
            DevStash.
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

  if (status === "expired" || status === "invalid") {
    const heading =
      status === "expired" ? "Link expired" : "Invalid verification link";
    const description =
      status === "expired"
        ? "This verification link has expired. Enter your email below and we'll send you a new one."
        : "We couldn't verify this link. It may have already been used. Enter your email below to send a fresh link.";

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ResendVerificationButton initialEmail={email} requireInput />
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground">
          {email ? (
            <>
              We sent a verification link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Click it to activate your account.
            </>
          ) : (
            <>We sent you a verification link. Click it to activate your account.</>
          )}
        </p>
      </div>

      <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
        Didn&apos;t get the email? Check your spam folder, or request a new
        link below.
      </div>

      <ResendVerificationButton initialEmail={email} />

      <p className="text-center text-sm text-muted-foreground">
        Already verified?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
