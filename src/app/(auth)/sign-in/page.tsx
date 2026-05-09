import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RegisteredToast } from "@/components/auth/registered-toast";
import { SignInForm } from "@/components/auth/sign-in-form";

type SearchParams = Promise<{ callbackUrl?: string | string[] }>;

export const metadata = {
  title: "Sign in · DevStash"
};

export default async function SignInPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { callbackUrl } = await searchParams;
  const callback = Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl;

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={null}>
        <RegisteredToast />
      </Suspense>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.625rem]">
          Sign in to DevStash
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials or use GitHub to sign in
        </p>
      </div>
      <SignInForm callbackUrl={callback} />
    </div>
  );
}
