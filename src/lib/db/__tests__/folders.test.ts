import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    folder: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn()
    },
    item: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
      updateMany: vi.fn()
    }
  }
}));

vi.mock("@/lib/db/items", () => ({
  getItemsForUserByFolderId: vi.fn()
}));

import { prisma } from "@/lib/prisma";
import { getItemsForUserByFolderId } from "@/lib/db/items";
import {
  createFolderForUser,
  deleteFolderForUser,
  getFolderFilesForDownload,
  getFolderWithItemsForUser,
  getFoldersForUser,
  getUserFoldersList,
  moveItemToFolder,
  updateFolderForUser
} from "@/lib/db/folders";

const mockedFolderCreate = prisma.folder.create as unknown as ReturnType<
  typeof vi.fn
>;
const mockedFolderFindFirst = prisma.folder.findFirst as unknown as ReturnType<
  typeof vi.fn
>;
const mockedFolderFindMany = prisma.folder.findMany as unknown as ReturnType<
  typeof vi.fn
>;
const mockedFolderUpdateMany =
  prisma.folder.updateMany as unknown as ReturnType<typeof vi.fn>;
const mockedFolderDeleteMany =
  prisma.folder.deleteMany as unknown as ReturnType<typeof vi.fn>;
const mockedItemFindFirst = prisma.item.findFirst as unknown as ReturnType<
  typeof vi.fn
>;
const mockedItemFindMany = prisma.item.findMany as unknown as ReturnType<
  typeof vi.fn
>;
const mockedItemGroupBy = prisma.item.groupBy as unknown as ReturnType<
  typeof vi.fn
>;
const mockedItemAggregate = prisma.item.aggregate as unknown as ReturnType<
  typeof vi.fn
>;
const mockedItemUpdateMany = prisma.item.updateMany as unknown as ReturnType<
  typeof vi.fn
>;
const mockedGetItems = getItemsForUserByFolderId as unknown as ReturnType<
  typeof vi.fn
>;

describe("createFolderForUser", () => {
  beforeEach(() => {
    mockedFolderCreate.mockReset();
  });

  it("creates the folder under the given userId and returns FolderWithMeta defaults", async () => {
    const now = new Date("2026-05-31T00:00:00Z");
    mockedFolderCreate.mockResolvedValue({
      id: "folder_1",
      name: "Design Assets",
      createdAt: now,
      updatedAt: now
    });

    const result = await createFolderForUser("user_1", {
      name: "Design Assets"
    });

    expect(mockedFolderCreate).toHaveBeenCalledWith({
      data: { name: "Design Assets", userId: "user_1" },
      select: { id: true, name: true, createdAt: true, updatedAt: true }
    });
    expect(result).toEqual({
      id: "folder_1",
      name: "Design Assets",
      createdAt: now,
      updatedAt: now,
      itemCount: 0,
      totalSize: 0,
      previewImageUrls: []
    });
  });
});

describe("getUserFoldersList", () => {
  beforeEach(() => {
    mockedFolderFindMany.mockReset();
  });

  it("returns id+name pairs sorted by name", async () => {
    mockedFolderFindMany.mockResolvedValue([
      { id: "folder_a", name: "Apple" },
      { id: "folder_b", name: "Banana" }
    ]);

    const result = await getUserFoldersList("user_1");

    expect(mockedFolderFindMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    });
    expect(result).toEqual([
      { id: "folder_a", name: "Apple" },
      { id: "folder_b", name: "Banana" }
    ]);
  });
});

describe("getFoldersForUser", () => {
  beforeEach(() => {
    mockedFolderFindMany.mockReset();
    mockedItemFindMany.mockReset();
    mockedItemFindMany.mockResolvedValue([]);
    mockedItemGroupBy.mockReset();
    mockedItemGroupBy.mockResolvedValue([]);
  });

  it("returns [] without the batched queries when the user has no folders", async () => {
    mockedFolderFindMany.mockResolvedValue([]);

    const result = await getFoldersForUser("user_1");

    expect(result).toEqual([]);
    expect(mockedItemFindMany).not.toHaveBeenCalled();
    expect(mockedItemGroupBy).not.toHaveBeenCalled();
  });

  it("orders by name asc, selects _count, and batches the preview + size queries", async () => {
    const now = new Date("2026-05-31T00:00:00Z");
    mockedFolderFindMany.mockResolvedValue([
      {
        id: "folder_1",
        name: "Invoices",
        createdAt: now,
        updatedAt: now,
        _count: { items: 3 }
      },
      {
        id: "folder_2",
        name: "Shots",
        createdAt: now,
        updatedAt: now,
        _count: { items: 0 }
      }
    ]);
    mockedItemFindMany.mockResolvedValue([
      { folderId: "folder_1", fileUrl: "https://r2/a.png" },
      { folderId: "folder_1", fileUrl: "https://r2/b.png" }
    ]);
    mockedItemGroupBy.mockResolvedValue([
      { folderId: "folder_1", _sum: { fileSize: 4096 } }
    ]);

    const result = await getFoldersForUser("user_1");

    expect(mockedFolderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_1" },
        orderBy: { name: "asc" }
      })
    );
    expect(mockedItemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user_1",
          folderId: { in: ["folder_1", "folder_2"] },
          itemType: { name: "image" },
          fileUrl: { not: null }
        },
        orderBy: { createdAt: "desc" }
      })
    );
    expect(mockedItemGroupBy).toHaveBeenCalledWith({
      by: ["folderId"],
      where: { userId: "user_1", folderId: { in: ["folder_1", "folder_2"] } },
      _sum: { fileSize: true }
    });
    expect(result).toEqual([
      {
        id: "folder_1",
        name: "Invoices",
        createdAt: now,
        updatedAt: now,
        itemCount: 3,
        totalSize: 4096,
        previewImageUrls: ["https://r2/a.png", "https://r2/b.png"]
      },
      {
        id: "folder_2",
        name: "Shots",
        createdAt: now,
        updatedAt: now,
        itemCount: 0,
        totalSize: 0,
        previewImageUrls: []
      }
    ]);
  });

  it("caps the preview mosaic at 4 images per folder", async () => {
    const now = new Date("2026-05-31T00:00:00Z");
    mockedFolderFindMany.mockResolvedValue([
      {
        id: "folder_1",
        name: "Shots",
        createdAt: now,
        updatedAt: now,
        _count: { items: 9 }
      }
    ]);
    mockedItemFindMany.mockResolvedValue(
      Array.from({ length: 9 }, (_, i) => ({
        folderId: "folder_1",
        fileUrl: `https://r2/${i}.png`
      }))
    );

    const [folder] = await getFoldersForUser("user_1");

    expect(folder.previewImageUrls).toHaveLength(4);
  });
});

describe("getFolderWithItemsForUser", () => {
  beforeEach(() => {
    mockedFolderFindFirst.mockReset();
    mockedGetItems.mockReset();
    mockedItemAggregate.mockReset();
  });

  it("returns null and skips the items + size fetch when the folder is not owned", async () => {
    mockedFolderFindFirst.mockResolvedValue(null);

    const result = await getFolderWithItemsForUser("user_1", "folder_missing");

    expect(result).toBeNull();
    expect(mockedFolderFindFirst).toHaveBeenCalledWith({
      where: { id: "folder_missing", userId: "user_1" },
      select: { id: true, name: true, updatedAt: true }
    });
    expect(mockedGetItems).not.toHaveBeenCalled();
    expect(mockedItemAggregate).not.toHaveBeenCalled();
  });

  it("returns folder metadata + items + totalItemCount + totalSize when owned", async () => {
    const now = new Date("2026-05-31T00:00:00Z");
    mockedFolderFindFirst.mockResolvedValue({
      id: "folder_1",
      name: "Invoices",
      updatedAt: now
    });
    mockedGetItems.mockResolvedValue({ items: [{ id: "item_1" }], totalCount: 12 });
    mockedItemAggregate.mockResolvedValue({ _sum: { fileSize: 8192 } });

    const result = await getFolderWithItemsForUser("user_1", "folder_1", {
      skip: 0,
      take: 21
    });

    expect(mockedGetItems).toHaveBeenCalledWith("user_1", "folder_1", {
      skip: 0,
      take: 21
    });
    expect(mockedItemAggregate).toHaveBeenCalledWith({
      where: { userId: "user_1", folderId: "folder_1" },
      _sum: { fileSize: true }
    });
    expect(result).toEqual({
      id: "folder_1",
      name: "Invoices",
      updatedAt: now,
      totalSize: 8192,
      items: [{ id: "item_1" }],
      totalItemCount: 12
    });
  });

  it("treats a null _sum.fileSize as totalSize 0", async () => {
    const now = new Date("2026-05-31T00:00:00Z");
    mockedFolderFindFirst.mockResolvedValue({
      id: "folder_1",
      name: "Empty",
      updatedAt: now
    });
    mockedGetItems.mockResolvedValue({ items: [], totalCount: 0 });
    mockedItemAggregate.mockResolvedValue({ _sum: { fileSize: null } });

    const result = await getFolderWithItemsForUser("user_1", "folder_1");

    expect(result?.totalSize).toBe(0);
  });
});

describe("updateFolderForUser", () => {
  beforeEach(() => {
    mockedFolderUpdateMany.mockReset();
  });

  it("scopes the update by id + userId and returns true when a row was updated", async () => {
    mockedFolderUpdateMany.mockResolvedValue({ count: 1 });

    const result = await updateFolderForUser("user_1", "folder_1", {
      name: "Renamed"
    });

    expect(mockedFolderUpdateMany).toHaveBeenCalledWith({
      where: { id: "folder_1", userId: "user_1" },
      data: { name: "Renamed" }
    });
    expect(result).toBe(true);
  });

  it("returns false when no row matched (wrong owner or missing id)", async () => {
    mockedFolderUpdateMany.mockResolvedValue({ count: 0 });

    const result = await updateFolderForUser("user_1", "folder_other", {
      name: "x"
    });

    expect(result).toBe(false);
  });
});

describe("deleteFolderForUser", () => {
  beforeEach(() => {
    mockedFolderDeleteMany.mockReset();
  });

  it("scopes the delete by id + userId", async () => {
    mockedFolderDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteFolderForUser("user_1", "folder_1");

    expect(mockedFolderDeleteMany).toHaveBeenCalledWith({
      where: { id: "folder_1", userId: "user_1" }
    });
    expect(result).toBe(true);
  });

  it("returns false when no row matched", async () => {
    mockedFolderDeleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteFolderForUser("user_1", "missing");

    expect(result).toBe(false);
  });
});

describe("moveItemToFolder", () => {
  beforeEach(() => {
    mockedItemFindFirst.mockReset();
    mockedFolderFindFirst.mockReset();
    mockedItemUpdateMany.mockReset();
  });

  it("returns not-found when the item is not owned by the user", async () => {
    mockedItemFindFirst.mockResolvedValue(null);

    const result = await moveItemToFolder("user_1", "item_x", "folder_1");

    expect(result).toEqual({ ok: false, reason: "not-found" });
    expect(mockedItemUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects items that are not file/image", async () => {
    mockedItemFindFirst.mockResolvedValue({
      id: "item_1",
      itemType: { name: "snippet" }
    });

    const result = await moveItemToFolder("user_1", "item_1", "folder_1");

    expect(result).toEqual({ ok: false, reason: "wrong-type" });
    expect(mockedFolderFindFirst).not.toHaveBeenCalled();
    expect(mockedItemUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects a folderId the user does not own", async () => {
    mockedItemFindFirst.mockResolvedValue({
      id: "item_1",
      itemType: { name: "image" }
    });
    mockedFolderFindFirst.mockResolvedValue(null);

    const result = await moveItemToFolder("user_1", "item_1", "folder_other");

    expect(result).toEqual({ ok: false, reason: "invalid-folder" });
    expect(mockedItemUpdateMany).not.toHaveBeenCalled();
  });

  it("files an item into an owned folder", async () => {
    mockedItemFindFirst.mockResolvedValue({
      id: "item_1",
      itemType: { name: "file" }
    });
    mockedFolderFindFirst.mockResolvedValue({ id: "folder_1" });
    mockedItemUpdateMany.mockResolvedValue({ count: 1 });

    const result = await moveItemToFolder("user_1", "item_1", "folder_1");

    expect(mockedItemUpdateMany).toHaveBeenCalledWith({
      where: { id: "item_1", userId: "user_1" },
      data: { folderId: "folder_1" }
    });
    expect(result).toEqual({ ok: true });
  });

  it("unfiles an item when folderId is null (no folder ownership check)", async () => {
    mockedItemFindFirst.mockResolvedValue({
      id: "item_1",
      itemType: { name: "image" }
    });
    mockedItemUpdateMany.mockResolvedValue({ count: 1 });

    const result = await moveItemToFolder("user_1", "item_1", null);

    expect(mockedFolderFindFirst).not.toHaveBeenCalled();
    expect(mockedItemUpdateMany).toHaveBeenCalledWith({
      where: { id: "item_1", userId: "user_1" },
      data: { folderId: null }
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("getFolderFilesForDownload", () => {
  beforeEach(() => {
    mockedFolderFindFirst.mockReset();
    mockedItemFindMany.mockReset();
  });

  it("returns null and skips the items fetch when the folder is not owned", async () => {
    mockedFolderFindFirst.mockResolvedValue(null);

    const result = await getFolderFilesForDownload("user_1", "folder_missing");

    expect(result).toBeNull();
    expect(mockedFolderFindFirst).toHaveBeenCalledWith({
      where: { id: "folder_missing", userId: "user_1" },
      select: { name: true }
    });
    expect(mockedItemFindMany).not.toHaveBeenCalled();
  });

  it("scopes the item query by userId + folder + file/image type and maps fileUrl/fileName + name + totalSize", async () => {
    mockedFolderFindFirst.mockResolvedValue({ name: "Invoices" });
    mockedItemFindMany.mockResolvedValue([
      {
        id: "item_1",
        fileUrl: "https://r2/a.pdf",
        fileName: "a.pdf",
        fileSize: 1000
      },
      {
        id: "item_2",
        fileUrl: "https://r2/b.png",
        fileName: null,
        fileSize: 2000
      }
    ]);

    const result = await getFolderFilesForDownload("user_1", "folder_1");

    expect(mockedItemFindMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        folderId: "folder_1",
        itemType: { name: { in: ["file", "image"] } },
        fileUrl: { not: null }
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, fileUrl: true, fileName: true, fileSize: true }
    });
    expect(result).toEqual({
      name: "Invoices",
      totalSize: 3000,
      files: [
        { id: "item_1", fileUrl: "https://r2/a.pdf", fileName: "a.pdf" },
        { id: "item_2", fileUrl: "https://r2/b.png", fileName: null }
      ]
    });
  });

  it("treats a missing fileSize as 0 and returns an empty file list for an empty folder", async () => {
    mockedFolderFindFirst.mockResolvedValue({ name: "Empty" });
    mockedItemFindMany.mockResolvedValue([]);

    const result = await getFolderFilesForDownload("user_1", "folder_1");

    expect(result).toEqual({ name: "Empty", totalSize: 0, files: [] });
  });
});
