import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  signOut: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      delete: vi.fn()
    }
  }
}));

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteAccountAction } from "@/actions/account";

// `auth` is heavily overloaded in NextAuth; cast to a simple async fn for tests.
const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedSignOut = signOut as unknown as ReturnType<typeof vi.fn>;
const mockedUserDelete = prisma.user.delete as unknown as ReturnType<
  typeof vi.fn
>;

describe("deleteAccountAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedSignOut.mockReset();
    mockedUserDelete.mockReset();
  });

  it("returns an error when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await deleteAccountAction();

    expect(result).toEqual({ error: "You are not signed in." });
    expect(mockedUserDelete).not.toHaveBeenCalled();
    expect(mockedSignOut).not.toHaveBeenCalled();
  });

  it("returns an error when the session has no user id", async () => {
    mockedAuth.mockResolvedValue({ user: { email: "x@example.com" } });

    const result = await deleteAccountAction();

    expect(result).toEqual({ error: "You are not signed in." });
    expect(mockedUserDelete).not.toHaveBeenCalled();
    expect(mockedSignOut).not.toHaveBeenCalled();
  });

  it("deletes the user and signs out when authenticated", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "user_123", email: "x@example.com" }
    });
    mockedUserDelete.mockResolvedValue({ id: "user_123" });
    mockedSignOut.mockResolvedValue(undefined);

    const result = await deleteAccountAction();

    expect(mockedUserDelete).toHaveBeenCalledOnce();
    expect(mockedUserDelete).toHaveBeenCalledWith({
      where: { id: "user_123" }
    });
    expect(mockedSignOut).toHaveBeenCalledOnce();
    expect(mockedSignOut).toHaveBeenCalledWith({ redirectTo: "/" });
    expect(result).toBeUndefined();
  });
});
