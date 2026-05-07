import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { createVerificationToken } from "@/lib/verification-token";
import { getBaseUrl } from "@/lib/base-url";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENERIC_OK = NextResponse.json({ success: true }, { status: 200 });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body as { email?: unknown } | null)?.email;
  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, emailVerified: true, password: true }
  });

  // Always respond identically to avoid leaking account existence /
  // verification status. Only actually send when there is something to verify.
  if (!user || user.emailVerified || !user.password) {
    return GENERIC_OK;
  }

  try {
    const { token } = await createVerificationToken(normalizedEmail);
    const baseUrl = await getBaseUrl();
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
    await sendVerificationEmail({
      to: normalizedEmail,
      name: user.name,
      verifyUrl
    });
  } catch (error) {
    console.error("[resend-verification] failed to send email", error);
    return NextResponse.json(
      { error: "Could not send verification email. Please try again." },
      { status: 500 }
    );
  }

  return GENERIC_OK;
}
