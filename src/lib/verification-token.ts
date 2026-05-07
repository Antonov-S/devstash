import "server-only";

import { randomBytes, createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type VerificationTokenResult = {
  token: string;
  expires: Date;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createVerificationToken(
  email: string
): Promise<VerificationTokenResult> {
  const identifier = email.toLowerCase();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: tokenHash, expires }
  });

  return { token, expires };
}

export type ConsumeResult =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid" | "expired" };

export async function consumeVerificationToken(
  token: string
): Promise<ConsumeResult> {
  if (!token) return { ok: false, reason: "invalid" };

  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findUnique({
    where: { token: tokenHash }
  });

  if (!record) return { ok: false, reason: "invalid" };

  await prisma.verificationToken.delete({ where: { token: tokenHash } });

  if (record.expires.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, email: record.identifier };
}
