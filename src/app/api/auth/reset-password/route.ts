import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { BCRYPT_ROUNDS, MIN_PASSWORD_LENGTH } from "@/lib/auth-constants";
import { consumePasswordResetToken } from "@/lib/verification-token";
import {
  extractIp,
  rateLimit,
  rateLimitJsonResponse
} from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = await rateLimit("resetPassword", extractIp(request.headers));
  if (!limit.success) return rateLimitJsonResponse(limit);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { token, password, confirmPassword } = body as Record<string, unknown>;

  if (typeof token !== "string" || !token) {
    return NextResponse.json(
      { error: "Reset token is required", code: "invalid" },
      { status: 400 }
    );
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }
  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match" },
      { status: 400 }
    );
  }

  const result = await consumePasswordResetToken(token);
  if (!result.ok) {
    const error =
      result.reason === "expired"
        ? "This reset link has expired. Request a new one."
        : "This reset link is invalid or has already been used.";
    return NextResponse.json(
      { error, code: result.reason },
      { status: 400 }
    );
  }

  const passwordHash = await hash(password, BCRYPT_ROUNDS);

  // updateMany so a missing user (e.g. deleted between issue and consume) is
  // a no-op rather than a 500.
  await prisma.user.updateMany({
    where: { email: result.email },
    data: { password: passwordHash }
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
