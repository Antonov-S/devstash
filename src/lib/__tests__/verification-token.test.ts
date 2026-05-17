import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn()
    }
  }
}));

import { prisma } from "@/lib/prisma";
import {
  consumePasswordResetToken,
  consumeVerificationToken
} from "@/lib/verification-token";

const mockedFindUnique = prisma.verificationToken
  .findUnique as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = prisma.verificationToken.delete as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("consumeVerificationToken", () => {
  it("returns invalid for empty token", async () => {
    const result = await consumeVerificationToken("");
    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });

  it("returns invalid when no row matches", async () => {
    mockedFindUnique.mockResolvedValue(null);
    const result = await consumeVerificationToken("nope");
    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("rejects cross-purpose tokens with prefixed identifiers", async () => {
    mockedFindUnique.mockResolvedValue({
      identifier: "password-reset:user@example.com",
      token: "hash",
      expires: new Date(Date.now() + 60_000)
    });
    const result = await consumeVerificationToken("tok");
    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("returns expired without deleting when the token is past expiry", async () => {
    mockedFindUnique.mockResolvedValue({
      identifier: "user@example.com",
      token: "hash",
      expires: new Date(Date.now() - 1000)
    });
    const result = await consumeVerificationToken("tok");
    expect(result).toEqual({ ok: false, reason: "expired" });
    // The row stays so a refresh still reports "expired" instead of
    // collapsing to a misleading "invalid".
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("returns ok and deletes the row on a valid token", async () => {
    mockedFindUnique.mockResolvedValue({
      identifier: "user@example.com",
      token: "hash",
      expires: new Date(Date.now() + 60_000)
    });
    mockedDelete.mockResolvedValue({});
    const result = await consumeVerificationToken("tok");
    expect(result).toEqual({ ok: true, email: "user@example.com" });
    expect(mockedDelete).toHaveBeenCalledOnce();
  });
});

describe("consumePasswordResetToken", () => {
  it("returns invalid for empty token", async () => {
    const result = await consumePasswordResetToken("");
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("returns invalid for tokens without the reset prefix", async () => {
    mockedFindUnique.mockResolvedValue({
      identifier: "user@example.com",
      token: "hash",
      expires: new Date(Date.now() + 60_000)
    });
    const result = await consumePasswordResetToken("tok");
    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("returns expired without deleting when the token is past expiry", async () => {
    mockedFindUnique.mockResolvedValue({
      identifier: "password-reset:user@example.com",
      token: "hash",
      expires: new Date(Date.now() - 1000)
    });
    const result = await consumePasswordResetToken("tok");
    expect(result).toEqual({ ok: false, reason: "expired" });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("returns ok with the unprefixed email and deletes on success", async () => {
    mockedFindUnique.mockResolvedValue({
      identifier: "password-reset:user@example.com",
      token: "hash",
      expires: new Date(Date.now() + 60_000)
    });
    mockedDelete.mockResolvedValue({});
    const result = await consumePasswordResetToken("tok");
    expect(result).toEqual({ ok: true, email: "user@example.com" });
    expect(mockedDelete).toHaveBeenCalledOnce();
  });
});
