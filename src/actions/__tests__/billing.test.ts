import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock("@/lib/base-url", () => ({
  getBaseUrl: vi.fn().mockResolvedValue("https://example.com")
}));

// vi.mock factories run before any top-level const, so the fns the factory
// closes over must be created via vi.hoisted() to be defined at that point.
const { mockedCheckoutCreate, mockedPortalCreate } = vi.hoisted(() => ({
  mockedCheckoutCreate: vi.fn(),
  mockedPortalCreate: vi.fn()
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: mockedCheckoutCreate } },
    billingPortal: { sessions: { create: mockedPortalCreate } }
  }),
  STRIPE_PRICE_IDS: {
    monthly: () => "price_monthly_test",
    yearly: () => "price_yearly_test"
  }
}));

// next/navigation's redirect() throws a NEXT_REDIRECT control-flow error
// in real Next, but the easiest way to verify "we tried to redirect to X"
// inside a unit test is to make our mock throw with the URL attached.
class RedirectError extends Error {
  url: string;
  constructor(url: string) {
    super(`NEXT_REDIRECT:${url}`);
    this.url = url;
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectError(url);
  }
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createCheckoutSessionAction,
  createPortalSessionAction
} from "@/actions/billing";

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedUserFindUnique = prisma.user.findUnique as unknown as ReturnType<
  typeof vi.fn
>;

const signedIn = { user: { id: "user_1", email: "u@example.com" } };

describe("createCheckoutSessionAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedUserFindUnique.mockReset();
    mockedCheckoutCreate.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await createCheckoutSessionAction("monthly");

    expect(result).toEqual({ error: "You are not signed in." });
    expect(mockedCheckoutCreate).not.toHaveBeenCalled();
  });

  it("rejects when the session has no email", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user_1" } });

    const result = await createCheckoutSessionAction("monthly");

    expect(result).toEqual({ error: "You are not signed in." });
    expect(mockedCheckoutCreate).not.toHaveBeenCalled();
  });

  it("rejects an invalid billing period (defense in depth)", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await createCheckoutSessionAction(
      "lifetime" as unknown as "monthly"
    );

    expect(result).toEqual({ error: "Invalid billing period." });
    expect(mockedUserFindUnique).not.toHaveBeenCalled();
    expect(mockedCheckoutCreate).not.toHaveBeenCalled();
  });

  it("rejects when the user is already Pro", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUserFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_existing",
      email: "u@example.com",
      isPro: true
    });

    const result = await createCheckoutSessionAction("monthly");

    expect(result).toEqual({ error: "You're already on the Pro plan." });
    expect(mockedCheckoutCreate).not.toHaveBeenCalled();
  });

  it("rejects when the user row is missing", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUserFindUnique.mockResolvedValue(null);

    const result = await createCheckoutSessionAction("monthly");

    expect(result).toEqual({ error: "User not found." });
    expect(mockedCheckoutCreate).not.toHaveBeenCalled();
  });

  it("creates a Checkout session for a Free user with no Stripe customer (passes customer_email, no customer)", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUserFindUnique.mockResolvedValue({
      stripeCustomerId: null,
      email: "u@example.com",
      isPro: false
    });
    mockedCheckoutCreate.mockResolvedValue({
      id: "cs_test_1",
      url: "https://checkout.stripe.test/cs_test_1"
    });

    try {
      await createCheckoutSessionAction("monthly");
    } catch (error) {
      expect(error).toBeInstanceOf(RedirectError);
      expect((error as RedirectError).url).toBe(
        "https://checkout.stripe.test/cs_test_1"
      );
    }

    expect(mockedCheckoutCreate).toHaveBeenCalledOnce();
    const [payload] = mockedCheckoutCreate.mock.calls[0];
    expect(payload.mode).toBe("subscription");
    expect(payload.customer).toBeUndefined();
    expect(payload.customer_email).toBe("u@example.com");
    expect(payload.client_reference_id).toBe("user_1");
    expect(payload.line_items).toEqual([
      { price: "price_monthly_test", quantity: 1 }
    ]);
    expect(payload.allow_promotion_codes).toBe(true);
    expect(payload.billing_address_collection).toBe("auto");
    expect(payload.automatic_tax).toEqual({ enabled: false });
    expect(payload.success_url).toBe(
      "https://example.com/settings?checkout=success"
    );
    expect(payload.cancel_url).toBe(
      "https://example.com/settings?checkout=cancelled"
    );
    expect(payload.subscription_data).toEqual({
      metadata: { userId: "user_1" }
    });
  });

  it("reuses an existing stripeCustomerId (passes customer, omits customer_email)", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUserFindUnique.mockResolvedValue({
      stripeCustomerId: "cus_existing",
      email: "u@example.com",
      isPro: false
    });
    mockedCheckoutCreate.mockResolvedValue({
      id: "cs_test_2",
      url: "https://checkout.stripe.test/cs_test_2"
    });

    try {
      await createCheckoutSessionAction("yearly");
    } catch (error) {
      expect(error).toBeInstanceOf(RedirectError);
    }

    const [payload] = mockedCheckoutCreate.mock.calls[0];
    expect(payload.customer).toBe("cus_existing");
    expect(payload.customer_email).toBeUndefined();
    expect(payload.line_items).toEqual([
      { price: "price_yearly_test", quantity: 1 }
    ]);
  });

  it("returns an error and does not redirect when Stripe throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUserFindUnique.mockResolvedValue({
      stripeCustomerId: null,
      email: "u@example.com",
      isPro: false
    });
    mockedCheckoutCreate.mockRejectedValue(new Error("stripe down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createCheckoutSessionAction("monthly");

    expect(result).toEqual({
      error: "Could not start checkout. Please try again."
    });
    errSpy.mockRestore();
  });

  it("returns an error when Checkout responds without a URL", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUserFindUnique.mockResolvedValue({
      stripeCustomerId: null,
      email: "u@example.com",
      isPro: false
    });
    mockedCheckoutCreate.mockResolvedValue({ id: "cs_test_noop", url: null });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createCheckoutSessionAction("monthly");

    expect(result).toEqual({
      error: "Could not start checkout. Please try again."
    });
    errSpy.mockRestore();
  });
});

describe("createPortalSessionAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedUserFindUnique.mockReset();
    mockedPortalCreate.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await createPortalSessionAction();

    expect(result).toEqual({ error: "You are not signed in." });
    expect(mockedPortalCreate).not.toHaveBeenCalled();
  });

  it("rejects when the user has no stripeCustomerId", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUserFindUnique.mockResolvedValue({ stripeCustomerId: null });

    const result = await createPortalSessionAction();

    expect(result).toEqual({ error: "No active subscription to manage." });
    expect(mockedPortalCreate).not.toHaveBeenCalled();
  });

  it("creates a portal session and redirects to it", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUserFindUnique.mockResolvedValue({ stripeCustomerId: "cus_42" });
    mockedPortalCreate.mockResolvedValue({
      url: "https://billing.stripe.test/p/session/abc"
    });

    try {
      await createPortalSessionAction();
    } catch (error) {
      expect(error).toBeInstanceOf(RedirectError);
      expect((error as RedirectError).url).toBe(
        "https://billing.stripe.test/p/session/abc"
      );
    }

    expect(mockedPortalCreate).toHaveBeenCalledOnce();
    const [payload] = mockedPortalCreate.mock.calls[0];
    expect(payload.customer).toBe("cus_42");
    expect(payload.return_url).toBe("https://example.com/settings");
  });

  it("returns an error when Stripe throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUserFindUnique.mockResolvedValue({ stripeCustomerId: "cus_42" });
    mockedPortalCreate.mockRejectedValue(new Error("stripe down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createPortalSessionAction();

    expect(result).toEqual({
      error: "Could not open the billing portal. Please try again."
    });
    errSpy.mockRestore();
  });
});
