import type { CollectionWithMeta } from "@/lib/db/collections";
import type { ItemWithMeta } from "@/lib/db/items";

export const FAVORITES_SORT_OPTIONS = [
  "newest",
  "oldest",
  "name-asc",
  "name-desc",
  "type"
] as const;

export type FavoritesSort = (typeof FAVORITES_SORT_OPTIONS)[number];

export const FAVORITES_SORT_LABELS: Record<FavoritesSort, string> = {
  newest: "Newest",
  oldest: "Oldest",
  "name-asc": "Name (A–Z)",
  "name-desc": "Name (Z–A)",
  type: "Item type"
};

export const DEFAULT_FAVORITES_SORT: FavoritesSort = "newest";

function compareByDateDesc(a: Date, b: Date): number {
  return b.getTime() - a.getTime();
}

function compareByDateAsc(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}

function compareByName(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function sortFavoriteItems(
  items: readonly ItemWithMeta[],
  sort: FavoritesSort
): ItemWithMeta[] {
  const copy = [...items];
  switch (sort) {
    case "oldest":
      copy.sort((a, b) => compareByDateAsc(a.updatedAt, b.updatedAt));
      return copy;
    case "name-asc":
      copy.sort((a, b) => compareByName(a.title, b.title));
      return copy;
    case "name-desc":
      copy.sort((a, b) => compareByName(b.title, a.title));
      return copy;
    case "type":
      copy.sort((a, b) => {
        const typeCmp = compareByName(a.itemType.name, b.itemType.name);
        if (typeCmp !== 0) return typeCmp;
        return compareByDateDesc(a.updatedAt, b.updatedAt);
      });
      return copy;
    case "newest":
    default:
      copy.sort((a, b) => compareByDateDesc(a.updatedAt, b.updatedAt));
      return copy;
  }
}

export function sortFavoriteCollections(
  collections: readonly CollectionWithMeta[],
  sort: FavoritesSort
): CollectionWithMeta[] {
  const copy = [...collections];
  switch (sort) {
    case "oldest":
      copy.sort((a, b) => compareByDateAsc(a.updatedAt, b.updatedAt));
      return copy;
    case "name-asc":
      copy.sort((a, b) => compareByName(a.name, b.name));
      return copy;
    case "name-desc":
      copy.sort((a, b) => compareByName(b.name, a.name));
      return copy;
    case "type":
      copy.sort((a, b) => {
        const aType = a.dominantType?.name ?? null;
        const bType = b.dominantType?.name ?? null;
        if (aType === null && bType === null) {
          return compareByDateDesc(a.updatedAt, b.updatedAt);
        }
        if (aType === null) return 1;
        if (bType === null) return -1;
        const typeCmp = compareByName(aType, bType);
        if (typeCmp !== 0) return typeCmp;
        return compareByDateDesc(a.updatedAt, b.updatedAt);
      });
      return copy;
    case "newest":
    default:
      copy.sort((a, b) => compareByDateDesc(a.updatedAt, b.updatedAt));
      return copy;
  }
}
