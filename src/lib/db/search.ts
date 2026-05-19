import "server-only";

import { prisma } from "@/lib/prisma";

export type SearchItemType = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type SearchItem = {
  id: string;
  title: string;
  preview: string | null;
  itemType: SearchItemType;
};

export type SearchCollection = {
  id: string;
  name: string;
  itemCount: number;
};

export type SearchData = {
  items: SearchItem[];
  collections: SearchCollection[];
};

const PREVIEW_LENGTH = 80;
const ITEMS_LIMIT = 500;
const COLLECTIONS_LIMIT = 200;

function buildPreview(
  description: string | null,
  content: string | null,
  url: string | null,
  fileName: string | null
): string | null {
  const source = description ?? content ?? url ?? fileName ?? null;
  if (!source) return null;
  const normalized = source.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.length > PREVIEW_LENGTH
    ? `${normalized.slice(0, PREVIEW_LENGTH - 1)}…`
    : normalized;
}

export async function getUserSearchData(userId: string): Promise<SearchData> {
  const [items, collections] = await Promise.all([
    prisma.item.findMany({
      where: { userId },
      orderBy: [
        { lastUsedAt: { sort: "desc", nulls: "last" } },
        { updatedAt: "desc" }
      ],
      take: ITEMS_LIMIT,
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        url: true,
        fileName: true,
        itemType: {
          select: { id: true, name: true, icon: true, color: true }
        }
      }
    }),
    prisma.collection.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: COLLECTIONS_LIMIT,
      select: {
        id: true,
        name: true,
        _count: { select: { items: true } }
      }
    })
  ]);

  return {
    items: items.map((row) => ({
      id: row.id,
      title: row.title,
      preview: buildPreview(row.description, row.content, row.url, row.fileName),
      itemType: row.itemType
    })),
    collections: collections.map((row) => ({
      id: row.id,
      name: row.name,
      itemCount: row._count.items
    }))
  };
}
