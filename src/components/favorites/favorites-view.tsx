"use client";

import { FolderOpen } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { FavoriteItemRow } from "@/components/favorites/favorite-item-row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { CollectionWithMeta } from "@/lib/db/collections";
import type { ItemWithMeta } from "@/lib/db/items";
import {
  DEFAULT_FAVORITES_SORT,
  FAVORITES_SORT_LABELS,
  FAVORITES_SORT_OPTIONS,
  type FavoritesSort,
  sortFavoriteCollections,
  sortFavoriteItems
} from "@/lib/favorites-sort";
import { formatDateRelative } from "@/lib/format-date";

type FavoritesViewProps = {
  items: ItemWithMeta[];
  collections: CollectionWithMeta[];
};

export function FavoritesView({ items, collections }: FavoritesViewProps) {
  const [itemsSort, setItemsSort] = useState<FavoritesSort>(DEFAULT_FAVORITES_SORT);
  const [collectionsSort, setCollectionsSort] = useState<FavoritesSort>(
    DEFAULT_FAVORITES_SORT
  );

  const sortedItems = useMemo(
    () => sortFavoriteItems(items, itemsSort),
    [items, itemsSort]
  );
  const sortedCollections = useMemo(
    () => sortFavoriteCollections(collections, collectionsSort),
    [collections, collectionsSort]
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3 px-1">
          <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Items ({sortedItems.length})
          </h2>
          {sortedItems.length > 1 && (
            <FavoritesSortSelect
              id="favorite-items-sort"
              ariaLabel="Sort favorite items"
              value={itemsSort}
              onChange={setItemsSort}
            />
          )}
        </div>
        {sortedItems.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {sortedItems.map((item) => (
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
        <div className="flex items-end justify-between gap-3 px-1">
          <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Collections ({sortedCollections.length})
          </h2>
          {sortedCollections.length > 1 && (
            <FavoritesSortSelect
              id="favorite-collections-sort"
              ariaLabel="Sort favorite collections"
              value={collectionsSort}
              onChange={setCollectionsSort}
            />
          )}
        </div>
        {sortedCollections.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {sortedCollections.map((collection) => {
                const dominantColor = collection.dominantType?.color;
                return (
                  <li key={collection.id}>
                    <Link
                      href={`/collections/${collection.id}`}
                      className="flex w-full items-center justify-between gap-4 px-4 py-2.5 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
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
    </div>
  );
}

function FavoritesSortSelect({
  id,
  ariaLabel,
  value,
  onChange
}: {
  id: string;
  ariaLabel: string;
  value: FavoritesSort;
  onChange: (value: FavoritesSort) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next != null) onChange(next as FavoritesSort);
      }}
    >
      <SelectTrigger id={id} size="sm" className="min-w-40" aria-label={ariaLabel}>
        <SelectValue>
          {(v) => FAVORITES_SORT_LABELS[v as FavoritesSort] ?? ""}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {FAVORITES_SORT_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {FAVORITES_SORT_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
