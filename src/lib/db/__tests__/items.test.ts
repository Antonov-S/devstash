import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn()
    },
    itemType: {
      findFirst: vi.fn()
    },
    tagsOnItems: {
      deleteMany: vi.fn()
    },
    itemCollection: {
      deleteMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

vi.mock("@/lib/r2", () => ({
  deleteObjectFromR2: vi.fn(),
  keyFromPublicUrl: vi.fn()
}));

import { prisma } from "@/lib/prisma";
import { deleteObjectFromR2, keyFromPublicUrl } from "@/lib/r2";
import {
  createItemForUser,
  deleteItemForUser,
  getItemDetailForUser,
  getItemsForUserByCollectionId,
  getItemsForUserByTypeId,
  getPinnedItemsForUser,
  setItemFavoriteForUser,
  updateItemForUser
} from "@/lib/db/items";

const mockedFindFirst = prisma.item.findFirst as unknown as ReturnType<
  typeof vi.fn
>;
const mockedFindMany = prisma.item.findMany as unknown as ReturnType<
  typeof vi.fn
>;
const mockedItemUpdate = prisma.item.update as unknown as ReturnType<
  typeof vi.fn
>;
const mockedTagsDeleteMany = prisma.tagsOnItems.deleteMany as unknown as ReturnType<
  typeof vi.fn
>;
const mockedItemCollectionDeleteMany =
  prisma.itemCollection.deleteMany as unknown as ReturnType<typeof vi.fn>;
const mockedTransaction = prisma.$transaction as unknown as ReturnType<
  typeof vi.fn
>;
const mockedItemCount = prisma.item.count as unknown as ReturnType<
  typeof vi.fn
>;
const mockedItemUpdateMany = prisma.item.updateMany as unknown as ReturnType<
  typeof vi.fn
>;

const baseRow = {
  id: "item_1",
  title: "useAuth Hook",
  description: "Custom hook",
  language: "typescript",
  isFavorite: true,
  isPinned: false,
  lastUsedAt: new Date("2025-01-10T00:00:00Z"),
  updatedAt: new Date("2025-01-15T00:00:00Z"),
  createdAt: new Date("2025-01-01T00:00:00Z"),
  contentType: "TEXT" as const,
  content: "const x = 1;",
  fileUrl: null,
  fileName: null,
  fileSize: null,
  url: null,
  itemType: {
    id: "type_1",
    name: "snippet",
    icon: "Code",
    color: "#3b82f6"
  },
  tags: [{ tag: { name: "react" } }, { tag: { name: "auth" } }],
  collections: [
    { collection: { id: "coll_1", name: "React Patterns" } },
    { collection: { id: "coll_2", name: "Hooks" } }
  ]
};

describe("getItemDetailForUser", () => {
  beforeEach(() => {
    mockedFindFirst.mockReset();
  });

  it("returns null when the item does not exist or is not owned by the user", async () => {
    mockedFindFirst.mockResolvedValue(null);

    const result = await getItemDetailForUser("user_1", "item_1");

    expect(result).toBeNull();
    expect(mockedFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item_1", userId: "user_1" } })
    );
  });

  it("flattens tags and collections and exposes detail fields", async () => {
    mockedFindFirst.mockResolvedValue(baseRow);

    const result = await getItemDetailForUser("user_1", "item_1");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("item_1");
    expect(result?.title).toBe("useAuth Hook");
    expect(result?.contentType).toBe("TEXT");
    expect(result?.content).toBe("const x = 1;");
    expect(result?.createdAt).toEqual(new Date("2025-01-01T00:00:00Z"));
    expect(result?.tags).toEqual(["react", "auth"]);
    expect(result?.collections).toEqual([
      { id: "coll_1", name: "React Patterns" },
      { id: "coll_2", name: "Hooks" }
    ]);
    expect(result?.itemType).toEqual({
      id: "type_1",
      name: "snippet",
      icon: "Code",
      color: "#3b82f6"
    });
  });

  it("scopes the query to the requesting user", async () => {
    mockedFindFirst.mockResolvedValue(null);

    await getItemDetailForUser("user_42", "item_99");

    expect(mockedFindFirst).toHaveBeenCalledTimes(1);
    const call = mockedFindFirst.mock.calls[0][0];
    expect(call.where).toEqual({ id: "item_99", userId: "user_42" });
  });
});

describe("updateItemForUser", () => {
  beforeEach(() => {
    mockedFindFirst.mockReset();
    mockedItemUpdate.mockReset();
    mockedTagsDeleteMany.mockReset();
    mockedItemCollectionDeleteMany.mockReset();
    mockedTransaction.mockReset();
    mockedTransaction.mockResolvedValue([]);
  });

  it("returns null when the item is not owned by the user", async () => {
    mockedFindFirst.mockResolvedValue(null);

    const result = await updateItemForUser("user_1", "item_missing", {
      title: "New",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      collectionIds: []
    });

    expect(result).toBeNull();
    expect(mockedTransaction).not.toHaveBeenCalled();
  });

  it("disconnects existing tags and connects-or-creates the new ones", async () => {
    mockedFindFirst
      .mockResolvedValueOnce({ id: "item_1" })
      .mockResolvedValueOnce(baseRow);

    await updateItemForUser("user_1", "item_1", {
      title: "Updated",
      description: "desc",
      content: "code",
      url: null,
      language: "typescript",
      tags: ["react", "react", "hooks"],
      collectionIds: []
    });

    expect(mockedTagsDeleteMany).toHaveBeenCalledWith({
      where: { itemId: "item_1" }
    });
    expect(mockedItemUpdate).toHaveBeenCalledTimes(1);
    const updateArg = mockedItemUpdate.mock.calls[0][0];
    expect(updateArg.where).toEqual({ id: "item_1" });
    expect(updateArg.data.title).toBe("Updated");
    expect(updateArg.data.language).toBe("typescript");
    expect(updateArg.data.tags.create).toEqual([
      {
        tag: {
          connectOrCreate: {
            where: { name: "react" },
            create: { name: "react" }
          }
        }
      },
      {
        tag: {
          connectOrCreate: {
            where: { name: "hooks" },
            create: { name: "hooks" }
          }
        }
      }
    ]);
  });

  it("clears and reattaches collection links, deduping by id", async () => {
    mockedFindFirst
      .mockResolvedValueOnce({ id: "item_1" })
      .mockResolvedValueOnce(baseRow);

    await updateItemForUser("user_1", "item_1", {
      title: "Updated",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      collectionIds: ["coll_1", "coll_2", "coll_1"]
    });

    expect(mockedItemCollectionDeleteMany).toHaveBeenCalledWith({
      where: { itemId: "item_1" }
    });
    const updateArg = mockedItemUpdate.mock.calls[0][0];
    expect(updateArg.data.collections.create).toEqual([
      { collection: { connect: { id: "coll_1" } } },
      { collection: { connect: { id: "coll_2" } } }
    ]);
  });

  it("returns the refreshed ItemDetail after a successful update", async () => {
    mockedFindFirst
      .mockResolvedValueOnce({ id: "item_1" })
      .mockResolvedValueOnce(baseRow);

    const result = await updateItemForUser("user_1", "item_1", {
      title: "Updated",
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      collectionIds: []
    });

    expect(result).not.toBeNull();
    expect(result?.id).toBe("item_1");
    expect(result?.tags).toEqual(["react", "auth"]);
    expect(result?.collections).toEqual([
      { id: "coll_1", name: "React Patterns" },
      { id: "coll_2", name: "Hooks" }
    ]);
  });
});

describe("createItemForUser", () => {
  const mockedItemTypeFindFirst = prisma.itemType.findFirst as unknown as ReturnType<
    typeof vi.fn
  >;
  const mockedItemCreate = prisma.item.create as unknown as ReturnType<
    typeof vi.fn
  >;

  beforeEach(() => {
    mockedItemTypeFindFirst.mockReset();
    mockedItemCreate.mockReset();
    mockedFindFirst.mockReset();
  });

  it("returns null when no matching system item type exists", async () => {
    mockedItemTypeFindFirst.mockResolvedValue(null);

    const result = await createItemForUser("user_1", {
      typeName: "snippet",
      title: "Hi",
      description: null,
      content: null,
      url: null,
      language: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      tags: [],
      collectionIds: []
    });

    expect(result).toBeNull();
    expect(mockedItemCreate).not.toHaveBeenCalled();
  });

  it("creates a TEXT item with deduped connect-or-create tags for snippet", async () => {
    mockedItemTypeFindFirst.mockResolvedValue({ id: "type_1" });
    mockedItemCreate.mockResolvedValue({ id: "item_new" });
    mockedFindFirst.mockResolvedValue(baseRow);

    await createItemForUser("user_1", {
      typeName: "snippet",
      title: "useAuth",
      description: "desc",
      content: "const x = 1;",
      url: null,
      language: "typescript",
      fileUrl: null,
      fileName: null,
      fileSize: null,
      tags: ["react", "react", "hooks"],
      collectionIds: []
    });

    expect(mockedItemTypeFindFirst).toHaveBeenCalledWith({
      where: { name: "snippet", isSystem: true, userId: null },
      select: { id: true }
    });
    expect(mockedItemCreate).toHaveBeenCalledTimes(1);
    const createArg = mockedItemCreate.mock.calls[0][0];
    expect(createArg.data.title).toBe("useAuth");
    expect(createArg.data.contentType).toBe("TEXT");
    expect(createArg.data.userId).toBe("user_1");
    expect(createArg.data.itemTypeId).toBe("type_1");
    expect(createArg.data.language).toBe("typescript");
    expect(createArg.data.url).toBeNull();
    expect(createArg.data.tags.create).toEqual([
      {
        tag: {
          connectOrCreate: {
            where: { name: "react" },
            create: { name: "react" }
          }
        }
      },
      {
        tag: {
          connectOrCreate: {
            where: { name: "hooks" },
            create: { name: "hooks" }
          }
        }
      }
    ]);
  });

  it("creates a URL item with contentType=URL for link type", async () => {
    mockedItemTypeFindFirst.mockResolvedValue({ id: "type_link" });
    mockedItemCreate.mockResolvedValue({ id: "item_new" });
    mockedFindFirst.mockResolvedValue(baseRow);

    await createItemForUser("user_1", {
      typeName: "link",
      title: "Docs",
      description: null,
      content: null,
      url: "https://example.com",
      language: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      tags: [],
      collectionIds: []
    });

    const createArg = mockedItemCreate.mock.calls[0][0];
    expect(createArg.data.contentType).toBe("URL");
    expect(createArg.data.url).toBe("https://example.com");
  });

  it("creates a FILE item with file metadata for image type", async () => {
    mockedItemTypeFindFirst.mockResolvedValue({ id: "type_image" });
    mockedItemCreate.mockResolvedValue({ id: "item_new" });
    mockedFindFirst.mockResolvedValue(baseRow);

    await createItemForUser("user_1", {
      typeName: "image",
      title: "Logo",
      description: null,
      content: null,
      url: null,
      language: null,
      fileUrl: "https://files.example.com/uploads/user_1/abc.png",
      fileName: "logo.png",
      fileSize: 12345,
      tags: [],
      collectionIds: []
    });

    const createArg = mockedItemCreate.mock.calls[0][0];
    expect(createArg.data.contentType).toBe("FILE");
    expect(createArg.data.fileUrl).toBe(
      "https://files.example.com/uploads/user_1/abc.png"
    );
    expect(createArg.data.fileName).toBe("logo.png");
    expect(createArg.data.fileSize).toBe(12345);
    expect(createArg.data.content).toBeNull();
  });

  it("returns the refreshed ItemDetail after a successful create", async () => {
    mockedItemTypeFindFirst.mockResolvedValue({ id: "type_1" });
    mockedItemCreate.mockResolvedValue({ id: "item_new" });
    mockedFindFirst.mockResolvedValue(baseRow);

    const result = await createItemForUser("user_1", {
      typeName: "snippet",
      title: "Hi",
      description: null,
      content: null,
      url: null,
      language: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      tags: [],
      collectionIds: []
    });

    expect(result).not.toBeNull();
    expect(result?.tags).toEqual(["react", "auth"]);
    expect(mockedFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item_new", userId: "user_1" } })
    );
  });

  it("writes ItemCollection rows for each unique collectionId", async () => {
    mockedItemTypeFindFirst.mockResolvedValue({ id: "type_1" });
    mockedItemCreate.mockResolvedValue({ id: "item_new" });
    mockedFindFirst.mockResolvedValue(baseRow);

    await createItemForUser("user_1", {
      typeName: "snippet",
      title: "Hi",
      description: null,
      content: null,
      url: null,
      language: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      tags: [],
      collectionIds: ["coll_1", "coll_2", "coll_1"]
    });

    const createArg = mockedItemCreate.mock.calls[0][0];
    expect(createArg.data.collections.create).toEqual([
      { collection: { connect: { id: "coll_1" } } },
      { collection: { connect: { id: "coll_2" } } }
    ]);
  });
});

describe("deleteItemForUser", () => {
  const mockedDeleteMany = prisma.item.deleteMany as unknown as ReturnType<
    typeof vi.fn
  >;
  const mockedKeyFromPublicUrl = keyFromPublicUrl as unknown as ReturnType<
    typeof vi.fn
  >;
  const mockedDeleteObjectFromR2 = deleteObjectFromR2 as unknown as ReturnType<
    typeof vi.fn
  >;

  beforeEach(() => {
    mockedDeleteMany.mockReset();
    mockedFindFirst.mockReset();
    mockedKeyFromPublicUrl.mockReset();
    mockedDeleteObjectFromR2.mockReset();
  });

  it("scopes the lookup and delete to the requesting user and item id", async () => {
    mockedFindFirst.mockResolvedValue({ fileUrl: null });
    mockedDeleteMany.mockResolvedValue({ count: 1 });

    await deleteItemForUser("user_1", "item_1");

    expect(mockedFindFirst).toHaveBeenCalledWith({
      where: { id: "item_1", userId: "user_1" },
      select: { fileUrl: true }
    });
    expect(mockedDeleteMany).toHaveBeenCalledWith({
      where: { id: "item_1", userId: "user_1" }
    });
  });

  it("returns true when a row was deleted and skips R2 cleanup for text items", async () => {
    mockedFindFirst.mockResolvedValue({ fileUrl: null });
    mockedDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteItemForUser("user_1", "item_1");

    expect(result).toBe(true);
    expect(mockedDeleteObjectFromR2).not.toHaveBeenCalled();
  });

  it("returns false when no row matched (wrong owner or missing id)", async () => {
    mockedFindFirst.mockResolvedValue(null);

    const result = await deleteItemForUser("user_1", "item_missing");

    expect(result).toBe(false);
    expect(mockedDeleteMany).not.toHaveBeenCalled();
    expect(mockedDeleteObjectFromR2).not.toHaveBeenCalled();
  });

  it("deletes the R2 object when the item has a fileUrl", async () => {
    mockedFindFirst.mockResolvedValue({
      fileUrl: "https://files.example.com/uploads/user_1/abc.png"
    });
    mockedDeleteMany.mockResolvedValue({ count: 1 });
    mockedKeyFromPublicUrl.mockReturnValue("uploads/user_1/abc.png");
    mockedDeleteObjectFromR2.mockResolvedValue(undefined);

    const result = await deleteItemForUser("user_1", "item_1");

    expect(result).toBe(true);
    expect(mockedDeleteObjectFromR2).toHaveBeenCalledWith(
      "uploads/user_1/abc.png"
    );
  });

  it("still reports success when R2 cleanup throws", async () => {
    mockedFindFirst.mockResolvedValue({
      fileUrl: "https://files.example.com/uploads/user_1/abc.png"
    });
    mockedDeleteMany.mockResolvedValue({ count: 1 });
    mockedKeyFromPublicUrl.mockReturnValue("uploads/user_1/abc.png");
    mockedDeleteObjectFromR2.mockRejectedValue(new Error("R2 down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteItemForUser("user_1", "item_1");

    expect(result).toBe(true);
    errSpy.mockRestore();
  });
});

describe("getPinnedItemsForUser", () => {
  beforeEach(() => {
    mockedFindMany.mockReset();
    mockedFindMany.mockResolvedValue([]);
  });

  it("passes take: 50 by default and filters to pinned items for the user", async () => {
    await getPinnedItemsForUser("user_1");

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_1", isPinned: true },
        take: 50
      })
    );
  });

  it("uses an explicit limit when one is provided", async () => {
    await getPinnedItemsForUser("user_1", 5);

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
  });
});

describe("getItemsForUserByTypeId", () => {
  beforeEach(() => {
    mockedFindMany.mockReset();
    mockedFindMany.mockResolvedValue([]);
    mockedItemCount.mockReset();
    mockedItemCount.mockResolvedValue(0);
  });

  it("scopes the query, defaults to skip:0/take:200, and counts in parallel", async () => {
    mockedItemCount.mockResolvedValue(42);

    const result = await getItemsForUserByTypeId("user_1", "type_1");

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_1", itemTypeId: "type_1" },
        skip: 0,
        take: 200
      })
    );
    expect(mockedItemCount).toHaveBeenCalledWith({
      where: { userId: "user_1", itemTypeId: "type_1" }
    });
    expect(result.totalCount).toBe(42);
    expect(result.items).toEqual([]);
  });

  it("forwards explicit skip and take options", async () => {
    await getItemsForUserByTypeId("user_1", "type_1", { skip: 21, take: 21 });

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 21, take: 21 })
    );
  });

  it("maps the tag rows into a flat string[] inside the returned items", async () => {
    mockedFindMany.mockResolvedValue([baseRow]);
    mockedItemCount.mockResolvedValue(1);

    const { items, totalCount } = await getItemsForUserByTypeId(
      "user_1",
      "type_1"
    );

    expect(totalCount).toBe(1);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("item_1");
    expect(items[0].tags).toEqual(["react", "auth"]);
  });
});

describe("getItemsForUserByCollectionId", () => {
  beforeEach(() => {
    mockedFindMany.mockReset();
    mockedFindMany.mockResolvedValue([]);
    mockedItemCount.mockReset();
    mockedItemCount.mockResolvedValue(0);
  });

  it("filters by userId and collection membership with default skip:0/take:200", async () => {
    mockedItemCount.mockResolvedValue(5);

    const { totalCount } = await getItemsForUserByCollectionId(
      "user_1",
      "coll_1"
    );

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user_1",
          collections: { some: { collectionId: "coll_1" } }
        },
        skip: 0,
        take: 200
      })
    );
    expect(mockedItemCount).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        collections: { some: { collectionId: "coll_1" } }
      }
    });
    expect(totalCount).toBe(5);
  });

  it("forwards explicit skip and take options", async () => {
    await getItemsForUserByCollectionId("user_1", "coll_1", {
      skip: 42,
      take: 21
    });

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 42, take: 21 })
    );
  });

  it("maps the tag rows into a flat string[] inside the returned items", async () => {
    mockedFindMany.mockResolvedValue([baseRow]);
    mockedItemCount.mockResolvedValue(1);

    const { items } = await getItemsForUserByCollectionId("user_1", "coll_1");

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("item_1");
    expect(items[0].tags).toEqual(["react", "auth"]);
  });
});

describe("setItemFavoriteForUser", () => {
  beforeEach(() => {
    mockedItemUpdateMany.mockReset();
  });

  it("scopes the update by id + userId and returns true when a row was updated", async () => {
    mockedItemUpdateMany.mockResolvedValue({ count: 1 });

    const result = await setItemFavoriteForUser("user_1", "item_1", true);

    expect(mockedItemUpdateMany).toHaveBeenCalledWith({
      where: { id: "item_1", userId: "user_1" },
      data: { isFavorite: true }
    });
    expect(result).toBe(true);
  });

  it("returns false when no row matched (wrong owner or missing id)", async () => {
    mockedItemUpdateMany.mockResolvedValue({ count: 0 });

    const result = await setItemFavoriteForUser("user_1", "item_missing", true);

    expect(result).toBe(false);
  });

  it("forwards isFavorite=false through to the data payload", async () => {
    mockedItemUpdateMany.mockResolvedValue({ count: 1 });

    await setItemFavoriteForUser("user_1", "item_1", false);

    expect(mockedItemUpdateMany).toHaveBeenCalledWith({
      where: { id: "item_1", userId: "user_1" },
      data: { isFavorite: false }
    });
  });
});
