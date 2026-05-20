import { Star } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { FavoritesView } from "@/components/favorites/favorites-view";
import { getFavoriteCollectionsForUser } from "@/lib/db/collections";
import { getFavoriteItemsForUser } from "@/lib/db/items";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Favorites · DevStash"
};

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/favorites");
  const userId = session.user.id;

  const [items, collections] = await Promise.all([
    getFavoriteItemsForUser(userId),
    getFavoriteCollectionsForUser(userId)
  ]);

  const totalCount = items.length + collections.length;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex items-center gap-3">
        <Star
          className="size-6 fill-yellow-400 text-yellow-400"
          aria-hidden
        />
        <h1 className="text-2xl font-bold text-foreground">
          Favorites{" "}
          <span className="font-normal text-muted-foreground">
            ({totalCount})
          </span>
        </h1>
      </div>

      {totalCount === 0 ? (
        <section className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <span
            className="flex size-10 items-center justify-center rounded-md bg-muted/50"
            aria-hidden
          >
            <Star className="size-5 text-muted-foreground" />
          </span>
          <p className="mt-1 text-sm font-medium">No favorites yet</p>
          <p className="text-sm text-muted-foreground">
            Star items and collections to find them here.
          </p>
        </section>
      ) : (
        <FavoritesView items={items} collections={collections} />
      )}
    </div>
  );
}
