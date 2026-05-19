import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { findMany: vi.fn() },
    collection: { findMany: vi.fn() }
  }
}));

import { prisma } from "@/lib/prisma";
import { getUserSearchData } from "@/lib/db/search";

const mockedItemFindMany = prisma.item.findMany as unknown as ReturnType<
  typeof vi.fn
>;
const mockedCollectionFindMany = prisma.collection
  .findMany as unknown as ReturnType<typeof vi.fn>;

const snippetType = {
  id: "type-1",
  name: "snippet",
  icon: "Code",
  color: "#3b82f6"
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getUserSearchData", () => {
  it("scopes both queries by userId with bounded take + correct orderings", async () => {
    mockedItemFindMany.mockResolvedValue([]);
    mockedCollectionFindMany.mockResolvedValue([]);

    const out = await getUserSearchData("user_1");

    expect(out).toEqual({ items: [], collections: [] });

    expect(mockedItemFindMany).toHaveBeenCalledTimes(1);
    const itemArgs = mockedItemFindMany.mock.calls[0]![0];
    expect(itemArgs.where).toEqual({ userId: "user_1" });
    expect(itemArgs.take).toBe(500);
    expect(itemArgs.orderBy).toEqual([
      { lastUsedAt: { sort: "desc", nulls: "last" } },
      { updatedAt: "desc" }
    ]);

    expect(mockedCollectionFindMany).toHaveBeenCalledTimes(1);
    const collectionArgs = mockedCollectionFindMany.mock.calls[0]![0];
    expect(collectionArgs.where).toEqual({ userId: "user_1" });
    expect(collectionArgs.take).toBe(200);
    expect(collectionArgs.orderBy).toEqual({ updatedAt: "desc" });
    expect(collectionArgs.select._count).toEqual({ select: { items: true } });
  });

  it("derives item preview from description > content > url > fileName, normalizes whitespace, truncates with ellipsis", async () => {
    const longContent = "a".repeat(120);
    mockedItemFindMany.mockResolvedValue([
      {
        id: "i1",
        title: "T1",
        description: "Hello\n  world",
        content: null,
        url: null,
        fileName: null,
        itemType: snippetType
      },
      {
        id: "i2",
        title: "T2",
        description: null,
        content: longContent,
        url: null,
        fileName: null,
        itemType: snippetType
      },
      {
        id: "i3",
        title: "T3",
        description: null,
        content: null,
        url: "https://example.com",
        fileName: null,
        itemType: snippetType
      },
      {
        id: "i4",
        title: "T4",
        description: null,
        content: null,
        url: null,
        fileName: "report.pdf",
        itemType: snippetType
      },
      {
        id: "i5",
        title: "T5",
        description: "   ",
        content: null,
        url: null,
        fileName: null,
        itemType: snippetType
      }
    ]);
    mockedCollectionFindMany.mockResolvedValue([]);

    const out = await getUserSearchData("user_1");

    expect(out.items.map((i) => i.preview)).toEqual([
      "Hello world",
      `${"a".repeat(79)}…`,
      "https://example.com",
      "report.pdf",
      null
    ]);
  });

  it("flattens collections with itemCount from _count.items", async () => {
    mockedItemFindMany.mockResolvedValue([]);
    mockedCollectionFindMany.mockResolvedValue([
      { id: "c1", name: "Snippets", _count: { items: 3 } },
      { id: "c2", name: "Empty", _count: { items: 0 } }
    ]);

    const out = await getUserSearchData("user_1");

    expect(out.collections).toEqual([
      { id: "c1", name: "Snippets", itemCount: 3 },
      { id: "c2", name: "Empty", itemCount: 0 }
    ]);
  });
});
