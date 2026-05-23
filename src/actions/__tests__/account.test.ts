import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  signOut: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      delete: vi.fn(),
      findUnique: vi.fn()
    }
  }
}));

// vi.mock factories run before any top-level const, so the fn the factory
// closes over must be created via vi.hoisted() to exist at that point.
const { mockedSubscriptionsCancel } = vi.hoisted(() => ({
  mockedSubscriptionsCancel: vi.fn()
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    subscriptions: { cancel: mockedSubscriptionsCancel }
  })
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
const mockedUserFindUnique = prisma.user.findUnique as unknown as ReturnType<
  typeof vi.fn
>;

describe("deleteAccountAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedSignOut.mockReset();
    mockedUserDelete.mockReset();
    mockedUserFindUnique.mockReset();
    mockedSubscriptionsCancel.mockReset();
    // Default to no subscription so cases that don't care about billing
    // can skip the setup — subscription cases override below.
    mockedUserFindUnique.mockResolvedValue({ stripeSubscriptionId: null });
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

  it("skips Stripe cancel cleanly when the user has no subscription", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "user_123", email: "x@example.com" }
    });
    mockedUserFindUnique.mockResolvedValue({ stripeSubscriptionId: null });
    mockedUserDelete.mockResolvedValue({ id: "user_123" });
    mockedSignOut.mockResolvedValue(undefined);

    const result = await deleteAccountAction();

    expect(mockedSubscriptionsCancel).not.toHaveBeenCalled();
    expect(mockedUserDelete).toHaveBeenCalledWith({
      where: { id: "user_123" }
    });
    expect(mockedSignOut).toHaveBeenCalledWith({ redirectTo: "/" });
    expect(result).toBeUndefined();
  });

  it("cancels the Stripe subscription before deleting the user", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "user_123", email: "x@example.com" }
    });
    mockedUserFindUnique.mockResolvedValue({
      stripeSubscriptionId: "sub_abc"
    });
    mockedUserDelete.mockResolvedValue({ id: "user_123" });
    mockedSignOut.mockResolvedValue(undefined);
    mockedSubscriptionsCancel.mockResolvedValue({ id: "sub_abc" });

    const result = await deleteAccountAction();

    expect(mockedSubscriptionsCancel).toHaveBeenCalledOnce();
    expect(mockedSubscriptionsCancel).toHaveBeenCalledWith("sub_abc");
    // Verify ordering: cancel happens before user delete (would otherwise
    // strand the subscription if delete fired first).
    expect(
      mockedSubscriptionsCancel.mock.invocationCallOrder[0]
    ).toBeLessThan(mockedUserDelete.mock.invocationCallOrder[0]);
    expect(mockedUserDelete).toHaveBeenCalledWith({
      where: { id: "user_123" }
    });
    expect(mockedSignOut).toHaveBeenCalledOnce();
    expect(result).toBeUndefined();
  });

  it("still deletes the user when Stripe cancel throws (errors are swallowed)", async () => {
    mockedAuth.mockResolvedValue({
      user: { id: "user_123", email: "x@example.com" }
    });
    mockedUserFindUnique.mockResolvedValue({
      stripeSubscriptionId: "sub_abc"
    });
    mockedSubscriptionsCancel.mockRejectedValue(new Error("stripe down"));
    mockedUserDelete.mockResolvedValue({ id: "user_123" });
    mockedSignOut.mockResolvedValue(undefined);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteAccountAction();

    expect(mockedSubscriptionsCancel).toHaveBeenCalledWith("sub_abc");
    expect(mockedUserDelete).toHaveBeenCalledWith({
      where: { id: "user_123" }
    });
    expect(mockedSignOut).toHaveBeenCalledOnce();
    expect(result).toBeUndefined();

    errSpy.mockRestore();
  });
});
