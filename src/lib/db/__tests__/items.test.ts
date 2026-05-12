import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: vi.fn()
    }
  }
}));

import { prisma } from "@/lib/prisma";
import { getItemDetailForUser } from "@/lib/db/items";

const mockedFindFirst = prisma.item.findFirst as unknown as ReturnType<
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
