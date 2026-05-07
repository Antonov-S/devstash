import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { consumeVerificationToken } from "@/lib/verification-token";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const redirectTo = (status: string, email?: string) => {
    const target = new URL("/verify-email", url.origin);
    target.searchParams.set("status", status);
    if (email) target.searchParams.set("email", email);
    return NextResponse.redirect(target);
  };

  if (!token) return redirectTo("invalid");

  const result = await consumeVerificationToken(token);
  if (!result.ok) return redirectTo(result.reason);

  await prisma.user.updateMany({
    where: { email: result.email, emailVerified: null },
    data: { emailVerified: new Date() }
  });

  return redirectTo("verified", result.email);
}
