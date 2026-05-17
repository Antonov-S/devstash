import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { BCRYPT_ROUNDS } from "@/lib/auth-constants";
import { EMAIL_VERIFICATION_ENABLED, sendVerificationEmail } from "@/lib/email";
import { createVerificationToken } from "@/lib/verification-token";
import { getBaseUrl } from "@/lib/base-url";
import {
  extractIp,
  rateLimit,
  rateLimitJsonResponse
} from "@/lib/rate-limit";

export const runtime = "nodejs";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const limit = await rateLimit("register", extractIp(request.headers));
  if (!limit.success) return rateLimitJsonResponse(limit);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { name, email, password } = body as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 }
    );
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true }
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      emailVerified: EMAIL_VERIFICATION_ENABLED ? null : new Date()
    },
    select: { id: true, name: true, email: true }
  });

  if (!EMAIL_VERIFICATION_ENABLED) {
    return NextResponse.json(
      { success: true, user, emailSent: false },
      { status: 201 }
    );
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
    console.error("[register] failed to send verification email", error);
    return NextResponse.json(
      {
        success: true,
        user,
        emailSent: false,
        error:
          "Account created, but we couldn't send the verification email. Please request a new one."
      },
      { status: 201 }
    );
  }

  return NextResponse.json(
    { success: true, user, emailSent: true },
    { status: 201 }
  );
}
