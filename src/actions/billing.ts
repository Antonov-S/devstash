"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getBaseUrl } from "@/lib/base-url";
import { prisma } from "@/lib/prisma";
import {
  getStripe,
  STRIPE_PRICE_IDS,
  type BillingPeriod
} from "@/lib/stripe";

export type BillingActionResult = { error: string };

const BILLING_PERIODS: ReadonlySet<BillingPeriod> = new Set<BillingPeriod>([
  "monthly",
  "yearly"
]);

export async function createCheckoutSessionAction(
  period: BillingPeriod
): Promise<BillingActionResult | void> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { error: "You are not signed in." };
  }

  if (!BILLING_PERIODS.has(period)) {
    return { error: "Invalid billing period." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true, email: true, isPro: true }
  });
  if (!user) {
    return { error: "User not found." };
  }
  if (user.isPro) {
    return { error: "You're already on the Pro plan." };
  }

  const baseUrl = await getBaseUrl();
  const priceId = STRIPE_PRICE_IDS[period]();

  let checkoutUrl: string | null = null;
  try {
    const checkout = await getStripe().checkout.sessions.create({
      mode: "subscription",
      // Reuse the saved customer when present; otherwise let Checkout create
      // one and pick it up via the checkout.session.completed webhook.
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      client_reference_id: session.user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      automatic_tax: { enabled: false },
      success_url: `${baseUrl}/settings?checkout=success`,
      cancel_url: `${baseUrl}/settings?checkout=cancelled`,
      subscription_data: { metadata: { userId: session.user.id } }
    });

    if (!checkout.url) {
      console.error("[billing] Checkout session has no URL", {
        id: checkout.id
      });
      return { error: "Could not start checkout. Please try again." };
    }
    checkoutUrl = checkout.url;
  } catch (error) {
    console.error("[billing] createCheckoutSessionAction failed", error);
    return { error: "Could not start checkout. Please try again." };
  }

  // redirect() throws to short-circuit — must live outside the try/catch
  // above so its internal NEXT_REDIRECT control flow doesn't get swallowed.
  redirect(checkoutUrl);
}

export async function createPortalSessionAction(): Promise<
  BillingActionResult | void
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You are not signed in." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true }
  });
  if (!user?.stripeCustomerId) {
    return { error: "No active subscription to manage." };
  }

  const baseUrl = await getBaseUrl();

  let portalUrl: string | null = null;
  try {
    const portal = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/settings`
    });
    portalUrl = portal.url;
  } catch (error) {
    console.error("[billing] createPortalSessionAction failed", error);
    return { error: "Could not open the billing portal. Please try again." };
  }

  redirect(portalUrl);
}
