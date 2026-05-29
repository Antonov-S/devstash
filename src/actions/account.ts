"use server";

import { signOut } from "@/auth";
import { requireUserId } from "@/lib/actions/require-user";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export type DeleteAccountResult = { error: string };

export async function deleteAccountAction(): Promise<DeleteAccountResult | void> {
  const authed = await requireUserId();
  if (!authed.ok) {
    return { error: authed.error };
  }
  const { userId } = authed;

  // Cancel the Stripe subscription first so we don't keep billing a deleted
  // account. Errors are swallowed (logged only) — a Stripe outage shouldn't
  // block the user from deleting their data. Worst case: one orphan
  // subscription to reconcile manually. We intentionally do NOT delete the
  // Stripe Customer record (kept for audit/refund history per Stripe's
  // recommendation).
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true }
  });

  if (user?.stripeSubscriptionId) {
    try {
      await getStripe().subscriptions.cancel(user.stripeSubscriptionId);
    } catch (error) {
      console.error(
        "[deleteAccountAction] failed to cancel Stripe subscription",
        { subscriptionId: user.stripeSubscriptionId, error }
      );
    }
  }

  // Cascading deletes (User → Account, Session, Item, Collection, ItemType) are
  // declared in the Prisma schema via onDelete: Cascade.
  await prisma.user.delete({ where: { id: userId } });

  await signOut({ redirectTo: "/" });
}
