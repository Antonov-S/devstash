import "server-only";

import type { ContentType } from "@/generated/prisma/enums";

import { prisma } from "@/lib/prisma";
import { deleteObjectFromR2, keyFromPublicUrl } from "@/lib/r2";
import type { SystemTypeName } from "@/lib/system-types";

const CREATE_CONTENT_TYPE: Record<SystemTypeName, ContentType> = {
  snippet: "TEXT",
  prompt: "TEXT",
  command: "TEXT",
  note: "TEXT",
  link: "URL",
  file: "FILE",
  image: "FILE"
};

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
  content: string | null;
  url: string | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  itemType: ItemTypeMeta;
  tags: string[];
};

const itemSelect = {
  id: true,
  title: true,
  description: true,
  content: true,
  url: true,
  language: true,
  isFavorite: true,
  isPinned: true,
  lastUsedAt: true,
  updatedAt: true,
  createdAt: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
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
  content: string | null;
  url: string | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  itemType: ItemTypeMeta;
  tags: { tag: { name: string } }[];
};

function toItemWithMeta(row: ItemRow): ItemWithMeta {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    url: row.url,
    language: row.language,
    isFavorite: row.isFavorite,
    isPinned: row.isPinned,
    lastUsedAt: row.lastUsedAt,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
    fileUrl: row.fileUrl,
    fileName: row.fileName,
    fileSize: row.fileSize,
    itemType: row.itemType,
    tags: row.tags.map(({ tag }) => tag.name)
  };
}

export async function getPinnedItemsForUser(
  userId: string,
  limit = 50
): Promise<ItemWithMeta[]> {
  const rows = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: [{ lastUsedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    take: limit,
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

export async function getSystemItemTypeByName(
  name: string
): Promise<ItemTypeMeta | null> {
  const type = await prisma.itemType.findFirst({
    where: { name, isSystem: true, userId: null },
    select: { id: true, name: true, icon: true, color: true }
  });
  return type;
}

export async function getItemsForUserByTypeId(
  userId: string,
  itemTypeId: string,
  limit = 200
): Promise<ItemWithMeta[]> {
  const rows = await prisma.item.findMany({
    where: { userId, itemTypeId },
    orderBy: [{ lastUsedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    take: limit,
    select: itemSelect
  });
  return rows.map(toItemWithMeta);
}

export type ItemCollectionSummary = {
  id: string;
  name: string;
};

export type ItemDetail = ItemWithMeta & {
  contentType: ContentType;
  collections: ItemCollectionSummary[];
};

export async function getItemDetailForUser(
  userId: string,
  itemId: string
): Promise<ItemDetail | null> {
  const row = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: {
      ...itemSelect,
      contentType: true,
      collections: {
        select: { collection: { select: { id: true, name: true } } },
        orderBy: { addedAt: "desc" }
      }
    }
  });
  if (!row) return null;
  return {
    ...toItemWithMeta(row),
    contentType: row.contentType,
    collections: row.collections.map(({ collection }) => collection)
  };
}

export type ItemStats = {
  total: number;
  favorites: number;
};

export type UpdateItemInput = {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
};

export async function updateItemForUser(
  userId: string,
  itemId: string,
  data: UpdateItemInput
): Promise<ItemDetail | null> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true }
  });
  if (!existing) return null;

  const uniqueTags = Array.from(new Set(data.tags));

  await prisma.$transaction([
    prisma.tagsOnItems.deleteMany({ where: { itemId } }),
    prisma.item.update({
      where: { id: itemId },
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        url: data.url,
        language: data.language,
        tags: {
          create: uniqueTags.map((name) => ({
            tag: {
              connectOrCreate: {
                where: { name },
                create: { name }
              }
            }
          }))
        }
      }
    })
  ]);

  return getItemDetailForUser(userId, itemId);
}

export async function deleteItemForUser(
  userId: string,
  itemId: string
): Promise<boolean> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { fileUrl: true }
  });
  if (!existing) return false;

  const result = await prisma.item.deleteMany({
    where: { id: itemId, userId }
  });
  if (result.count === 0) return false;

  if (existing.fileUrl) {
    const key = keyFromPublicUrl(existing.fileUrl);
    if (key) {
      try {
        await deleteObjectFromR2(key);
      } catch (error) {
        // Object is orphaned in R2 but the DB row is gone — log and move on.
        console.error("Failed to delete R2 object for item", itemId, error);
      }
    }
  }

  return true;
}

export type CreateItemInput = {
  typeName: SystemTypeName;
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  tags: string[];
};

export async function createItemForUser(
  userId: string,
  data: CreateItemInput
): Promise<ItemDetail | null> {
  const itemType = await prisma.itemType.findFirst({
    where: { name: data.typeName, isSystem: true, userId: null },
    select: { id: true }
  });
  if (!itemType) return null;

  const uniqueTags = Array.from(new Set(data.tags));

  const created = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      contentType: CREATE_CONTENT_TYPE[data.typeName],
      userId,
      itemTypeId: itemType.id,
      tags: {
        create: uniqueTags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name },
              create: { name }
            }
          }
        }))
      }
    },
    select: { id: true }
  });

  return getItemDetailForUser(userId, created.id);
}

export async function getItemStatsForUser(userId: string): Promise<ItemStats> {
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } })
  ]);
  return { total, favorites };
}

export type SystemItemTypeWithCount = ItemTypeMeta & {
  itemCount: number;
};

const SYSTEM_TYPE_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link"
] as const;

export async function getSystemItemTypesWithCountsForUser(
  userId: string
): Promise<SystemItemTypeWithCount[]> {
  const [types, counts] = await Promise.all([
    prisma.itemType.findMany({
      where: { isSystem: true, userId: null },
      select: { id: true, name: true, icon: true, color: true }
    }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: { userId },
      _count: { _all: true }
    })
  ]);

  const countByTypeId = new Map(
    counts.map((row) => [row.itemTypeId, row._count._all])
  );

  const orderIndex = (name: string) => {
    const i = SYSTEM_TYPE_ORDER.indexOf(name as (typeof SYSTEM_TYPE_ORDER)[number]);
    return i === -1 ? SYSTEM_TYPE_ORDER.length : i;
  };

  return types
    .map((type) => ({
      id: type.id,
      name: type.name,
      icon: type.icon,
      color: type.color,
      itemCount: countByTypeId.get(type.id) ?? 0
    }))
    .sort((a, b) => orderIndex(a.name) - orderIndex(b.name));
}
