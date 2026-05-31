import "server-only";

import { prisma } from "@/lib/prisma";
import {
  getItemsForUserByFolderId,
  type ItemWithMeta
} from "@/lib/db/items";

export type FolderWithMeta = {
  id: string;
  name: string;
  updatedAt: Date;
  itemCount: number;
  // First few image fileUrls (≤4) for a mosaic thumbnail on the folder card.
  previewImageUrls: string[];
};

export type FolderWithItems = {
  id: string;
  name: string;
  updatedAt: Date;
  items: ItemWithMeta[];
  totalItemCount: number;
};

// Number of preview images shown in a folder card mosaic.
const PREVIEW_IMAGE_COUNT = 4;

export async function getFoldersForUser(
  userId: string
): Promise<FolderWithMeta[]> {
  const rows = await prisma.folder.findMany({
    where: { userId },
    // Order by name asc (not updatedAt): moving items in/out doesn't touch
    // Folder.updatedAt, so ordering by it would drift. Name is predictable and
    // matches getUserCollectionsList.
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      _count: { select: { items: true } }
    }
  });

  if (rows.length === 0) return [];

  const folderIds = rows.map((row) => row.id);
  // Batched follow-up for the mosaic — image-type items only, newest first.
  // N+1-safe: one query over all folders, grouped client-side.
  const images = await prisma.item.findMany({
    where: {
      userId,
      folderId: { in: folderIds },
      itemType: { name: "image" },
      fileUrl: { not: null }
    },
    orderBy: { createdAt: "desc" },
    select: { folderId: true, fileUrl: true }
  });

  const previewsByFolder = new Map<string, string[]>();
  for (const image of images) {
    if (!image.folderId || !image.fileUrl) continue;
    const list = previewsByFolder.get(image.folderId) ?? [];
    if (list.length >= PREVIEW_IMAGE_COUNT) continue;
    list.push(image.fileUrl);
    previewsByFolder.set(image.folderId, list);
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    updatedAt: row.updatedAt,
    itemCount: row._count.items,
    previewImageUrls: previewsByFolder.get(row.id) ?? []
  }));
}

export async function getFolderNameForUser(
  userId: string,
  folderId: string
): Promise<{ name: string } | null> {
  return prisma.folder.findFirst({
    where: { id: folderId, userId },
    select: { name: true }
  });
}

export async function getFolderWithItemsForUser(
  userId: string,
  folderId: string,
  options: { skip?: number; take?: number } = {}
): Promise<FolderWithItems | null> {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
    select: { id: true, name: true, updatedAt: true }
  });
  if (!folder) return null;

  const { items, totalCount } = await getItemsForUserByFolderId(
    userId,
    folderId,
    options
  );
  return { ...folder, items, totalItemCount: totalCount };
}

export type FolderListEntry = {
  id: string;
  name: string;
};

export async function getUserFoldersList(
  userId: string
): Promise<FolderListEntry[]> {
  return prisma.folder.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });
}

export type CreateFolderInput = {
  name: string;
};

export async function createFolderForUser(
  userId: string,
  data: CreateFolderInput
): Promise<FolderWithMeta> {
  const created = await prisma.folder.create({
    data: { name: data.name, userId },
    select: { id: true, name: true, updatedAt: true }
  });

  return {
    id: created.id,
    name: created.name,
    updatedAt: created.updatedAt,
    itemCount: 0,
    previewImageUrls: []
  };
}

export type UpdateFolderInput = {
  name: string;
};

export async function updateFolderForUser(
  userId: string,
  folderId: string,
  data: UpdateFolderInput
): Promise<boolean> {
  const result = await prisma.folder.updateMany({
    where: { id: folderId, userId },
    data: { name: data.name }
  });
  return result.count > 0;
}

export async function deleteFolderForUser(
  userId: string,
  folderId: string
): Promise<boolean> {
  // onDelete: SetNull loosens contained items back to top level.
  const result = await prisma.folder.deleteMany({
    where: { id: folderId, userId }
  });
  return result.count > 0;
}

export type MoveItemResult =
  | { ok: true }
  | { ok: false; reason: "invalid-folder" | "not-found" | "wrong-type" };

// Only these item types can be filed into folders. The folderId column is
// generic, but the feature is file/image-only — enforced here as the single
// write path (defense-in-depth against a tampered client).
const FOLDERABLE_TYPES = new Set(["file", "image"]);

/**
 * Files an item into a folder (or unfiles it when `folderId` is null).
 * Ownership-scoped: only touches rows where item.userId === userId. Verifies
 * the item is a file/image and (when filing) that the target folder is owned
 * by the user.
 */
export async function moveItemToFolder(
  userId: string,
  itemId: string,
  folderId: string | null
): Promise<MoveItemResult> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true, itemType: { select: { name: true } } }
  });
  if (!item) return { ok: false, reason: "not-found" };
  if (!FOLDERABLE_TYPES.has(item.itemType.name)) {
    return { ok: false, reason: "wrong-type" };
  }

  if (folderId !== null) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId },
      select: { id: true }
    });
    if (!folder) return { ok: false, reason: "invalid-folder" };
  }

  const result = await prisma.item.updateMany({
    where: { id: itemId, userId },
    data: { folderId }
  });
  if (result.count === 0) return { ok: false, reason: "not-found" };
  return { ok: true };
}
