import "server-only";

import { randomBytes, createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const RESET_PREFIX = "password-reset:";

export type VerificationTokenResult = {
  token: string;
  expires: Date;
};

export type ConsumeResult =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid" | "expired" };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createVerificationToken(
  email: string
): Promise<VerificationTokenResult> {
  const identifier = email.toLowerCase();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + VERIFY_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: tokenHash, expires }
  });

  return { token, expires };
}

export async function consumeVerificationToken(
  token: string
): Promise<ConsumeResult> {
  if (!token) return { ok: false, reason: "invalid" };

  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findUnique({
    where: { token: tokenHash }
  });

  if (!record) return { ok: false, reason: "invalid" };
  // Tokens issued for another purpose (e.g. password reset) carry an
  // identifier prefix and must not be accepted here.
  if (record.identifier.includes(":")) return { ok: false, reason: "invalid" };
  if (record.expires.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  await prisma.verificationToken.delete({ where: { token: tokenHash } });

  return { ok: true, email: record.identifier };
}

export async function createPasswordResetToken(
  email: string
): Promise<VerificationTokenResult> {
  const identifier = `${RESET_PREFIX}${email.toLowerCase()}`;
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + RESET_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: tokenHash, expires }
  });

  return { token, expires };
}

export async function peekPasswordResetToken(
  token: string
): Promise<ConsumeResult> {
  if (!token) return { ok: false, reason: "invalid" };

  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findUnique({
    where: { token: tokenHash }
  });

  if (!record) return { ok: false, reason: "invalid" };
  if (!record.identifier.startsWith(RESET_PREFIX)) {
    return { ok: false, reason: "invalid" };
  }
  if (record.expires.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, email: record.identifier.slice(RESET_PREFIX.length) };
}

export async function consumePasswordResetToken(
  token: string
): Promise<ConsumeResult> {
  if (!token) return { ok: false, reason: "invalid" };

  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findUnique({
    where: { token: tokenHash }
  });

  if (!record) return { ok: false, reason: "invalid" };
  if (!record.identifier.startsWith(RESET_PREFIX)) {
    return { ok: false, reason: "invalid" };
  }
  if (record.expires.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  await prisma.verificationToken.delete({ where: { token: tokenHash } });

  return { ok: true, email: record.identifier.slice(RESET_PREFIX.length) };
}
