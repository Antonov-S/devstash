import "server-only";

import { prisma } from "@/lib/prisma";
import {
  getItemsForUserByCollectionId,
  type ItemWithMeta
} from "@/lib/db/items";

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

export type CollectionListEntry = {
  id: string;
  name: string;
};

export async function getUserCollectionsList(
  userId: string
): Promise<CollectionListEntry[]> {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });
}

export async function verifyCollectionsOwnedByUser(
  userId: string,
  collectionIds: string[]
): Promise<boolean> {
  if (collectionIds.length === 0) return true;
  const owned = await prisma.collection.findMany({
    where: { userId, id: { in: collectionIds } },
    select: { id: true }
  });
  return owned.length === collectionIds.length;
}

export type CreateCollectionInput = {
  name: string;
  description: string | null;
};

export type CollectionWithItems = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  updatedAt: Date;
  items: ItemWithMeta[];
};

export async function getCollectionWithItemsForUser(
  userId: string,
  collectionId: string
): Promise<CollectionWithItems | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      updatedAt: true
    }
  });
  if (!collection) return null;

  const items = await getItemsForUserByCollectionId(userId, collectionId);
  return { ...collection, items };
}

export type UpdateCollectionInput = {
  name: string;
  description: string | null;
};

export async function updateCollectionForUser(
  userId: string,
  collectionId: string,
  data: UpdateCollectionInput
): Promise<boolean> {
  const result = await prisma.collection.updateMany({
    where: { id: collectionId, userId },
    data: { name: data.name, description: data.description }
  });
  return result.count > 0;
}

export async function deleteCollectionForUser(
  userId: string,
  collectionId: string
): Promise<boolean> {
  const result = await prisma.collection.deleteMany({
    where: { id: collectionId, userId }
  });
  return result.count > 0;
}

export async function createCollectionForUser(
  userId: string,
  data: CreateCollectionInput
): Promise<CollectionWithMeta> {
  const created = await prisma.collection.create({
    data: {
      name: data.name,
      description: data.description,
      userId
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      updatedAt: true
    }
  });

  return {
    id: created.id,
    name: created.name,
    description: created.description,
    isFavorite: created.isFavorite,
    updatedAt: created.updatedAt,
    itemCount: 0,
    dominantType: null,
    types: []
  };
}
