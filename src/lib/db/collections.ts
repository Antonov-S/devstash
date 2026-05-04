import "server-only";

import { prisma } from "@/lib/prisma";

export type CollectionTypeIcon = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type CollectionWithMeta = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  updatedAt: Date;
  itemCount: number;
  dominantType: CollectionTypeIcon | null;
  types: CollectionTypeIcon[];
};

async function fetchCollectionsWithMeta(
  userId: string,
  take?: number
): Promise<CollectionWithMeta[]> {
  const rows = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      updatedAt: true,
      _count: { select: { items: true } }
    }
  });

  if (rows.length === 0) return [];

  const collectionIds = rows.map((row) => row.id);
  const links = await prisma.itemCollection.findMany({
    where: { collectionId: { in: collectionIds } },
    select: {
      collectionId: true,
      item: {
        select: {
          itemType: {
            select: { id: true, name: true, icon: true, color: true }
          }
        }
      }
    }
  });

  const perCollection = new Map<
    string,
    Map<string, { count: number; type: CollectionTypeIcon }>
  >();
  for (const link of links) {
    let typeCounts = perCollection.get(link.collectionId);
    if (!typeCounts) {
      typeCounts = new Map();
      perCollection.set(link.collectionId, typeCounts);
    }
    const type = link.item.itemType;
    const current = typeCounts.get(type.id);
    if (current) {
      current.count += 1;
    } else {
      typeCounts.set(type.id, { count: 1, type });
    }
  }

  return rows.map((row) => {
    const typeCounts = perCollection.get(row.id);
    const sorted = typeCounts
      ? [...typeCounts.values()].sort((a, b) => b.count - a.count)
      : [];

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isFavorite: row.isFavorite,
      updatedAt: row.updatedAt,
      itemCount: row._count.items,
      dominantType: sorted[0]?.type ?? null,
      types: sorted.map(({ type }) => type)
    };
  });
}

export async function getRecentCollectionsForUser(
  userId: string,
  limit = 6
): Promise<CollectionWithMeta[]> {
  return fetchCollectionsWithMeta(userId, limit);
}

export async function getAllCollectionsForUser(
  userId: string
): Promise<CollectionWithMeta[]> {
  return fetchCollectionsWithMeta(userId);
}

export type CollectionStats = {
  total: number;
  favorites: number;
};

export async function getCollectionStatsForUser(
  userId: string
): Promise<CollectionStats> {
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } })
  ]);
  return { total, favorites };
}
