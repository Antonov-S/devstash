import Link from "next/link";
import { Clock, Pin } from "lucide-react";

import { CollectionCard } from "@/components/dashboard/collection-card";
import { ItemCard } from "@/components/dashboard/item-card";
import { StatsCards } from "@/components/dashboard/stats-cards";
import {
  getCollectionStatsForUser,
  getRecentCollectionsForUser
} from "@/lib/db/collections";
import { getDemoUserId } from "@/lib/db/users";
import { mockItems } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getDemoUserId();
  const [recentCollections, collectionStats] = await Promise.all([
    getRecentCollectionsForUser(userId, 6),
    getCollectionStatsForUser(userId)
  ]);

  const pinnedItems = mockItems.filter((i) => i.isPinned);

  const recentItems = [...mockItems]
    .sort((a, b) => {
      const aDate = (a.lastUsedAt ?? a.updatedAt).getTime();
      const bDate = (b.lastUsedAt ?? b.updatedAt).getTime();
      return bDate - aDate;
    })
    .slice(0, 10);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your developer knowledge hub
        </p>
      </div>

      <StatsCards
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

      {pinnedItems.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Pin className="size-4" />
            Pinned
          </h2>
          <div className="flex flex-col gap-2">
            {pinnedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

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
