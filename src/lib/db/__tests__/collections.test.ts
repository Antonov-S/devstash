import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      create: vi.fn()
    }
  }
}));

import { prisma } from "@/lib/prisma";
import { createCollectionForUser } from "@/lib/db/collections";

const mockedCreate = prisma.collection.create as unknown as ReturnType<
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
