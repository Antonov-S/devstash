import "server-only";

import { prisma } from "@/lib/prisma";

export type ItemTypeMeta = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type ItemWithMeta = {
  id: string;
  title: string;
  description: string | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date | null;
  updatedAt: Date;
  itemType: ItemTypeMeta;
  tags: string[];
};

const itemSelect = {
  id: true,
  title: true,
  description: true,
  language: true,
  isFavorite: true,
  isPinned: true,
  lastUsedAt: true,
  updatedAt: true,
  itemType: {
    select: { id: true, name: true, icon: true, color: true }
  },
  tags: {
    select: { tag: { select: { name: true } } }
  }
} as const;

type ItemRow = {
  id: string;
  title: string;
  description: string | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date | null;
  updatedAt: Date;
  itemType: ItemTypeMeta;
  tags: { tag: { name: string } }[];
};

function toItemWithMeta(row: ItemRow): ItemWithMeta {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    language: row.language,
    isFavorite: row.isFavorite,
    isPinned: row.isPinned,
    lastUsedAt: row.lastUsedAt,
    updatedAt: row.updatedAt,
    itemType: row.itemType,
    tags: row.tags.map(({ tag }) => tag.name)
  };
}

export async function getPinnedItemsForUser(
  userId: string
): Promise<ItemWithMeta[]> {
  const rows = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: [{ lastUsedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    select: itemSelect
  });
  return rows.map(toItemWithMeta);
}

export async function getRecentItemsForUser(
  userId: string,
  limit = 10
): Promise<ItemWithMeta[]> {
  const rows = await prisma.item.findMany({
    where: { userId },
    orderBy: [{ lastUsedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    take: limit,
    select: itemSelect
  });
  return rows.map(toItemWithMeta);
}

export type ItemStats = {
  total: number;
  favorites: number;
};

export async function getItemStatsForUser(userId: string): Promise<ItemStats> {
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } })
  ]);
  return { total, favorites };
}
