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

export async function getRecentCollectionsForUser(
  userId: string,
  limit = 6
): Promise<CollectionWithMeta[]> {
  const rows = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      items: {
        include: {
          item: {
            select: {
              itemType: {
                select: { id: true, name: true, icon: true, color: true }
              }
            }
          }
        }
      }
    }
  });

  return rows.map((row) => {
    const counts = new Map<
      string,
      { count: number; type: CollectionTypeIcon }
    >();
    for (const link of row.items) {
      const type = link.item.itemType;
      const current = counts.get(type.id);
      if (current) {
        current.count += 1;
      } else {
        counts.set(type.id, { count: 1, type });
      }
    }

    const sorted = [...counts.values()].sort((a, b) => b.count - a.count);
    const dominantType = sorted[0]?.type ?? null;
    const types = sorted.map(({ type }) => type);

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isFavorite: row.isFavorite,
      updatedAt: row.updatedAt,
      itemCount: row.items.length,
      dominantType,
      types
    };
  });
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
