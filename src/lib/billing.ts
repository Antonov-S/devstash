import "server-only";

import { FREE_TIER_LIMITS } from "@/lib/constants";
import {
  getItemStatsForUser,
  type ItemStats
} from "@/lib/db/items";
import {
  getCollectionStatsForUser,
  type CollectionStats
} from "@/lib/db/collections";

export type CapacityCheck = { ok: true } | { ok: false; reason: string };

// Always re-read isPro from the DB in write paths instead of trusting the
// JWT — the token can carry a stale value across a Stripe downgrade until
// the next session refresh.
export async function getUserIsPro(userId: string): Promise<boolean> {
  // Dynamic import keeps Prisma out of edge bundles that may transitively
  // import this module — only the callers that actually run on Node hit it.
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true }
  });
  return user?.isPro ?? false;
}

export async function checkItemCapacity(
  userId: string,
  isPro: boolean
): Promise<CapacityCheck> {
  if (isPro) return { ok: true };

  const stats: ItemStats = await getItemStatsForUser(userId);
  if (stats.total < FREE_TIER_LIMITS.items) return { ok: true };

  return {
    ok: false,
    reason: `Free plan is limited to ${FREE_TIER_LIMITS.items} items. Upgrade to Pro for unlimited.`
  };
}

export async function checkCollectionCapacity(
  userId: string,
  isPro: boolean
): Promise<CapacityCheck> {
  if (isPro) return { ok: true };

  const stats: CollectionStats = await getCollectionStatsForUser(userId);
  if (stats.total < FREE_TIER_LIMITS.collections) return { ok: true };

  return {
    ok: false,
    reason: `Free plan is limited to ${FREE_TIER_LIMITS.collections} collections. Upgrade to Pro for unlimited.`
  };
}
