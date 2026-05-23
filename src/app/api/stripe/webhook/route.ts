import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Resolve a string ID from a `string | { id: string } | null | undefined`
// field — Stripe expands some relationships when called via the API but
// webhooks ship them as bare ID strings, so we have to handle both.
function resolveId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "string"
  ) {
    return (value as { id: string }).id;
  }
  return null;
}

function isActiveStatus(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}

export async function POST(request: Request) {
  // MUST read the raw body — calling .json() first mutates whitespace and
  // breaks Stripe's HMAC signature verification.
  const rawBody = await request.text();

  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature" },
      { status: 400 }
    );
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[stripe webhook] signature verification failed:", message);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.client_reference_id ??
          (typeof session.metadata?.userId === "string"
            ? session.metadata.userId
            : null);
        const customerId = resolveId(session.customer);
        const subscriptionId = resolveId(session.subscription);

        if (!userId || !customerId || !subscriptionId) {
          console.warn(
            "[stripe webhook] checkout.session.completed missing fields",
            { userId, customerId, subscriptionId, eventId: event.id }
          );
          break;
        }

        // updateMany so a stale userId (e.g. account deleted before Stripe
        // delivered the event) collapses to zero matches instead of throwing.
        await prisma.user.updateMany({
          where: { id: userId },
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            isPro: true
          }
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = resolveId(sub.customer);
        if (!customerId) {
          console.warn(
            "[stripe webhook] subscription event missing customer",
            { eventId: event.id, type: event.type }
          );
          break;
        }

        // Re-fetch from Stripe instead of trusting the event-payload snapshot.
        // A newly-created subscription often passes through `incomplete` before
        // reaching `active`, and `subscription.created`/`updated` events arrive
        // concurrently with `checkout.session.completed` — without re-fetching,
        // a stale snapshot can race in and overwrite isPro=true back to false.
        const current = await getStripe().subscriptions.retrieve(sub.id);

        // updateMany so retries that arrive before checkout.session.completed
        // has linked the customer to a user don't throw a Prisma P2025 — zero
        // matches is a non-error.
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            isPro: isActiveStatus(current.status),
            stripeSubscriptionId: current.id
          }
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = resolveId(sub.customer);
        if (!customerId) {
          console.warn(
            "[stripe webhook] subscription.deleted missing customer",
            { eventId: event.id }
          );
          break;
        }

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { isPro: false, stripeSubscriptionId: null }
        });
        break;
      }

      default:
        // Acknowledge unknown events with 200 so Stripe stops retrying them.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // Post-signature-verification failure — log and return 500 so Stripe
    // retries with exponential backoff.
    console.error(
      `[stripe webhook] handler failed for ${event.type}:`,
      error
    );
    return NextResponse.json(
      { error: "Handler failed" },
      { status: 500 }
    );
  }
}
