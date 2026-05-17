import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn()
    },
    itemType: {
      findFirst: vi.fn()
    },
    tagsOnItems: {
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
  getPinnedItemsForUser,
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
const mockedTransaction = prisma.$transaction as unknown as ReturnType<
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
      tags: []
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
      tags: ["react", "react", "hooks"]
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
      tags: []
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
      tags: []
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
      tags: ["react", "react", "hooks"]
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
      tags: []
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
      tags: []
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
      tags: []
    });

    expect(result).not.toBeNull();
    expect(result?.tags).toEqual(["react", "auth"]);
    expect(mockedFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item_new", userId: "user_1" } })
    );
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
