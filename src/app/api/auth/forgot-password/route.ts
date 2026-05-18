import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { EMAIL_REGEX } from "@/lib/auth-constants";
import { sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/verification-token";
import { getBaseUrl } from "@/lib/base-url";
import {
  extractIp,
  rateLimit,
  rateLimitJsonResponse
} from "@/lib/rate-limit";

export const runtime = "nodejs";

const GENERIC_OK = NextResponse.json({ success: true }, { status: 200 });

export async function POST(request: Request) {
  const limit = await rateLimit("forgotPassword", extractIp(request.headers));
  if (!limit.success) return rateLimitJsonResponse(limit);

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
    select: { id: true, name: true, password: true }
  });

  // Always respond identically to avoid leaking account existence. Only send
  // when there is a credentials user with a password set (OAuth-only users
  // can't reset what they don't have).
  if (!user || !user.password) {
    return GENERIC_OK;
  }

  try {
    const { token } = await createPasswordResetToken(normalizedEmail);
    const baseUrl = await getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({
      to: normalizedEmail,
      name: user.name,
      resetUrl
    });
  } catch (error) {
    console.error("[forgot-password] failed to send email", error);
    return NextResponse.json(
      { error: "Could not send reset email. Please try again." },
      { status: 500 }
    );
  }

  return GENERIC_OK;
}
