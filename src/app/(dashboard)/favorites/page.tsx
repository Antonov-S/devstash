import { FolderOpen, Star } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { FavoriteItemRow } from "@/components/favorites/favorite-item-row";
import { getFavoriteCollectionsForUser } from "@/lib/db/collections";
import { getFavoriteItemsForUser } from "@/lib/db/items";
import { formatDateRelative } from "@/lib/format-date";

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
        <>
          <section className="flex flex-col gap-3">
            <h2 className="px-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Items ({items.length})
            </h2>
            {items.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <li key={item.id}>
                      <FavoriteItemRow item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="px-1 font-mono text-xs text-muted-foreground">
                No starred items
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="px-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Collections ({collections.length})
            </h2>
            {collections.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <ul className="divide-y divide-border">
                  {collections.map((collection) => {
                    const dominantColor = collection.dominantType?.color;
                    return (
                      <li key={collection.id}>
                        <Link
                          href={`/collections/${collection.id}`}
                          className="flex w-full items-center justify-between gap-4 px-4 py-2.5 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <FolderOpen
                              className="size-4 shrink-0 text-muted-foreground"
                              style={
                                dominantColor ? { color: dominantColor } : undefined
                              }
                              aria-hidden
                            />
                            <span className="truncate font-mono text-sm text-foreground">
                              {collection.name}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span
                              className="rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium"
                              style={
                                dominantColor
                                  ? {
                                      color: dominantColor,
                                      borderColor: `${dominantColor}66`,
                                      backgroundColor: `${dominantColor}1a`
                                    }
                                  : undefined
                              }
                            >
                              {collection.itemCount}{" "}
                              {collection.itemCount === 1 ? "item" : "items"}
                            </span>
                            <span className="hidden whitespace-nowrap font-mono text-xs text-muted-foreground sm:inline">
                              {formatDateRelative(collection.updatedAt)}
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="px-1 font-mono text-xs text-muted-foreground">
                No starred collections
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
