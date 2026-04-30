import Link from "next/link";
import { Clock, Pin } from "lucide-react";

import { CollectionCard } from "@/components/dashboard/collection-card";
import { ItemCard } from "@/components/dashboard/item-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import {
  getCollectionStatsForUser,
  getRecentCollectionsForUser
} from "@/lib/db/collections";
import {
  getItemStatsForUser,
  getPinnedItemsForUser,
  getRecentItemsForUser
} from "@/lib/db/items";
import { getDemoUserId } from "@/lib/db/users";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getDemoUserId();
  const [
    recentCollections,
    collectionStats,
    pinnedItems,
    recentItems,
    itemStats
  ] = await Promise.all([
    getRecentCollectionsForUser(userId, 6),
    getCollectionStatsForUser(userId),
    getPinnedItemsForUser(userId),
    getRecentItemsForUser(userId, 10),
    getItemStatsForUser(userId)
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your developer knowledge hub
        </p>
      </div>

      <StatsCards
        itemCount={itemStats.total}
        favoriteItemCount={itemStats.favorites}
        collectionCount={collectionStats.total}
        favoriteCollectionCount={collectionStats.favorites}
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Collections</h2>
          <Link
            href="/collections"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recentCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Pin className="size-4" />
          Pinned
        </h2>
        {pinnedItems.length > 0 ? (
          <div className="flex flex-col gap-2">
            {pinnedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-card p-8 text-center">
            <span
              className="flex size-8 items-center justify-center rounded-md bg-muted/50"
              aria-hidden
            >
              <Pin className="size-4 text-muted-foreground" />
            </span>
            <p className="mt-1 text-sm font-medium">No pinned items</p>
            <p className="text-xs text-muted-foreground">
              Pin an item to keep it at the top of your dashboard.
            </p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Clock className="size-4" />
          Recent
        </h2>
        <div className="flex flex-col gap-2">
          {recentItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
