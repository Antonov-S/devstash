import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn()
    }
  }
}));

vi.mock("@/lib/db/items", () => ({
  getItemsForUserByCollectionId: vi.fn()
}));

import { prisma } from "@/lib/prisma";
import { getItemsForUserByCollectionId } from "@/lib/db/items";
import {
  createCollectionForUser,
  deleteCollectionForUser,
  getCollectionWithItemsForUser,
  getUserCollectionsList,
  updateCollectionForUser,
  verifyCollectionsOwnedByUser
} from "@/lib/db/collections";

const mockedCreate = prisma.collection.create as unknown as ReturnType<
  typeof vi.fn
>;
const mockedDeleteMany =
  prisma.collection.deleteMany as unknown as ReturnType<typeof vi.fn>;
const mockedFindFirst = prisma.collection.findFirst as unknown as ReturnType<
  typeof vi.fn
>;
const mockedFindMany = prisma.collection.findMany as unknown as ReturnType<
  typeof vi.fn
>;
const mockedUpdateMany =
  prisma.collection.updateMany as unknown as ReturnType<typeof vi.fn>;
const mockedGetItems = getItemsForUserByCollectionId as unknown as ReturnType<
  typeof vi.fn
>;

describe("createCollectionForUser", () => {
  beforeEach(() => {
    mockedCreate.mockReset();
  });

  it("creates the collection under the given userId and returns CollectionWithMeta", async () => {
    const now = new Date("2026-05-18T00:00:00Z");
    mockedCreate.mockResolvedValue({
      id: "coll_1",
      name: "React Patterns",
      description: "Custom hooks",
      isFavorite: false,
      updatedAt: now
    });

    const result = await createCollectionForUser("user_1", {
      name: "React Patterns",
      description: "Custom hooks"
    });

    expect(mockedCreate).toHaveBeenCalledWith({
      data: {
        name: "React Patterns",
        description: "Custom hooks",
        userId: "user_1"
      },
      select: {
        id: true,
        name: true,
        description: true,
        isFavorite: true,
        updatedAt: true
      }
    });

    expect(result).toEqual({
      id: "coll_1",
      name: "React Patterns",
      description: "Custom hooks",
      isFavorite: false,
      updatedAt: now,
      itemCount: 0,
      dominantType: null,
      types: []
    });
  });

  it("passes a null description through to the row", async () => {
    const now = new Date("2026-05-18T00:00:00Z");
    mockedCreate.mockResolvedValue({
      id: "coll_2",
      name: "Hooks",
      description: null,
      isFavorite: false,
      updatedAt: now
    });

    const result = await createCollectionForUser("user_1", {
      name: "Hooks",
      description: null
    });

    const [args] = mockedCreate.mock.calls[0];
    expect(args.data.description).toBeNull();
    expect(result.description).toBeNull();
    expect(result.itemCount).toBe(0);
    expect(result.dominantType).toBeNull();
    expect(result.types).toEqual([]);
  });
});

describe("getUserCollectionsList", () => {
  beforeEach(() => {
    mockedFindMany.mockReset();
  });

  it("returns the user's collections as id+name pairs sorted by name", async () => {
    mockedFindMany.mockResolvedValue([
      { id: "coll_a", name: "Apple" },
      { id: "coll_b", name: "Banana" }
    ]);

    const result = await getUserCollectionsList("user_1");

    expect(mockedFindMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    });
    expect(result).toEqual([
      { id: "coll_a", name: "Apple" },
      { id: "coll_b", name: "Banana" }
    ]);
  });
});

describe("verifyCollectionsOwnedByUser", () => {
  beforeEach(() => {
    mockedFindMany.mockReset();
  });

  it("returns true immediately for an empty id list without querying", async () => {
    const result = await verifyCollectionsOwnedByUser("user_1", []);

    expect(result).toBe(true);
    expect(mockedFindMany).not.toHaveBeenCalled();
  });

  it("returns true when every supplied id belongs to the user", async () => {
    mockedFindMany.mockResolvedValue([{ id: "coll_1" }, { id: "coll_2" }]);

    const result = await verifyCollectionsOwnedByUser("user_1", [
      "coll_1",
      "coll_2"
    ]);

    expect(mockedFindMany).toHaveBeenCalledWith({
      where: { userId: "user_1", id: { in: ["coll_1", "coll_2"] } },
      select: { id: true }
    });
    expect(result).toBe(true);
  });

  it("returns false when at least one id is missing or not owned", async () => {
    // Only one of the two ids matched — the other belongs to someone else.
    mockedFindMany.mockResolvedValue([{ id: "coll_1" }]);

    const result = await verifyCollectionsOwnedByUser("user_1", [
      "coll_1",
      "coll_other"
    ]);

    expect(result).toBe(false);
  });
});

describe("updateCollectionForUser", () => {
  beforeEach(() => {
    mockedUpdateMany.mockReset();
  });

  it("scopes the update to the user and returns true when a row was updated", async () => {
    mockedUpdateMany.mockResolvedValue({ count: 1 });

    const result = await updateCollectionForUser("user_1", "coll_1", {
      name: "Renamed",
      description: "Updated"
    });

    expect(mockedUpdateMany).toHaveBeenCalledWith({
      where: { id: "coll_1", userId: "user_1" },
      data: { name: "Renamed", description: "Updated" }
    });
    expect(result).toBe(true);
  });

  it("returns false when no row matches (wrong owner or missing id)", async () => {
    mockedUpdateMany.mockResolvedValue({ count: 0 });

    const result = await updateCollectionForUser("user_1", "coll_other", {
      name: "x",
      description: null
    });

    expect(result).toBe(false);
  });
});

describe("deleteCollectionForUser", () => {
  beforeEach(() => {
    mockedDeleteMany.mockReset();
  });

  it("scopes the delete by id + userId so cross-user deletes report no match", async () => {
    mockedDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteCollectionForUser("user_1", "coll_1");

    expect(mockedDeleteMany).toHaveBeenCalledWith({
      where: { id: "coll_1", userId: "user_1" }
    });
    expect(result).toBe(true);
  });

  it("returns false when no row matched", async () => {
    mockedDeleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteCollectionForUser("user_1", "missing");

    expect(result).toBe(false);
  });
});

describe("getCollectionWithItemsForUser", () => {
  beforeEach(() => {
    mockedFindFirst.mockReset();
    mockedGetItems.mockReset();
  });

  it("returns null and skips the items fetch when the collection is not owned by the user", async () => {
    mockedFindFirst.mockResolvedValue(null);

    const result = await getCollectionWithItemsForUser("user_1", "coll_missing");

    expect(result).toBeNull();
    expect(mockedFindFirst).toHaveBeenCalledWith({
      where: { id: "coll_missing", userId: "user_1" },
      select: {
        id: true,
        name: true,
        description: true,
        isFavorite: true,
        updatedAt: true
      }
    });
    expect(mockedGetItems).not.toHaveBeenCalled();
  });

  it("returns collection metadata + items when the collection belongs to the user", async () => {
    const now = new Date("2026-05-18T00:00:00Z");
    mockedFindFirst.mockResolvedValue({
      id: "coll_1",
      name: "React Patterns",
      description: "Custom hooks",
      isFavorite: true,
      updatedAt: now
    });
    const fakeItems = [
      {
        id: "item_1",
        title: "useAuth",
        tags: ["react"]
      }
    ];
    mockedGetItems.mockResolvedValue(fakeItems);

    const result = await getCollectionWithItemsForUser("user_1", "coll_1");

    expect(mockedGetItems).toHaveBeenCalledWith("user_1", "coll_1");
    expect(result).toEqual({
      id: "coll_1",
      name: "React Patterns",
      description: "Custom hooks",
      isFavorite: true,
      updatedAt: now,
      items: fakeItems
    });
  });
});
