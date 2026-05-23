import { describe, it, expect, vi, beforeEach } from "vitest";

import { FREE_TIER_LIMITS } from "@/lib/constants";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock("@/lib/db/items", () => ({
  getItemStatsForUser: vi.fn()
}));

vi.mock("@/lib/db/collections", () => ({
  getCollectionStatsForUser: vi.fn()
}));

import { prisma } from "@/lib/prisma";
import { getItemStatsForUser } from "@/lib/db/items";
import { getCollectionStatsForUser } from "@/lib/db/collections";
import {
  getUserIsPro,
  checkItemCapacity,
  checkCollectionCapacity
} from "@/lib/billing";

const mockedFindUnique = prisma.user.findUnique as unknown as ReturnType<
  typeof vi.fn
>;
const mockedItemStats = getItemStatsForUser as unknown as ReturnType<
  typeof vi.fn
>;
const mockedCollectionStats =
  getCollectionStatsForUser as unknown as ReturnType<typeof vi.fn>;

describe("getUserIsPro", () => {
  beforeEach(() => {
    mockedFindUnique.mockReset();
  });

  it("returns the DB isPro flag when the user exists", async () => {
    mockedFindUnique.mockResolvedValue({ isPro: true });
    await expect(getUserIsPro("user_123")).resolves.toBe(true);
    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: { id: "user_123" },
      select: { isPro: true }
    });
  });

  it("returns false when isPro is false", async () => {
    mockedFindUnique.mockResolvedValue({ isPro: false });
    await expect(getUserIsPro("user_123")).resolves.toBe(false);
  });

  it("returns false when the user is missing", async () => {
    mockedFindUnique.mockResolvedValue(null);
    await expect(getUserIsPro("user_404")).resolves.toBe(false);
  });
});

describe("checkItemCapacity", () => {
  beforeEach(() => {
    mockedItemStats.mockReset();
  });

  it("returns ok for Pro users without touching stats", async () => {
    const result = await checkItemCapacity("user_pro", true);
    expect(result).toEqual({ ok: true });
    expect(mockedItemStats).not.toHaveBeenCalled();
  });

  it("returns ok for Free users under the items limit", async () => {
    mockedItemStats.mockResolvedValue({
      total: FREE_TIER_LIMITS.items - 1,
      favorites: 0
    });
    const result = await checkItemCapacity("user_free", false);
    expect(result).toEqual({ ok: true });
    expect(mockedItemStats).toHaveBeenCalledWith("user_free");
  });

  it("rejects Free users exactly at the items limit", async () => {
    mockedItemStats.mockResolvedValue({
      total: FREE_TIER_LIMITS.items,
      favorites: 0
    });
    const result = await checkItemCapacity("user_free", false);
    expect(result).toEqual({
      ok: false,
      reason: `Free plan is limited to ${FREE_TIER_LIMITS.items} items. Upgrade to Pro for unlimited.`
    });
  });

  it("rejects Free users over the items limit", async () => {
    mockedItemStats.mockResolvedValue({
      total: FREE_TIER_LIMITS.items + 5,
      favorites: 0
    });
    const result = await checkItemCapacity("user_free", false);
    expect(result.ok).toBe(false);
  });
});

describe("checkCollectionCapacity", () => {
  beforeEach(() => {
    mockedCollectionStats.mockReset();
  });

  it("returns ok for Pro users without touching stats", async () => {
    const result = await checkCollectionCapacity("user_pro", true);
    expect(result).toEqual({ ok: true });
    expect(mockedCollectionStats).not.toHaveBeenCalled();
  });

  it("returns ok for Free users under the collections limit", async () => {
    mockedCollectionStats.mockResolvedValue({
      total: FREE_TIER_LIMITS.collections - 1,
      favorites: 0
    });
    const result = await checkCollectionCapacity("user_free", false);
    expect(result).toEqual({ ok: true });
    expect(mockedCollectionStats).toHaveBeenCalledWith("user_free");
  });

  it("rejects Free users exactly at the collections limit", async () => {
    mockedCollectionStats.mockResolvedValue({
      total: FREE_TIER_LIMITS.collections,
      favorites: 0
    });
    const result = await checkCollectionCapacity("user_free", false);
    expect(result).toEqual({
      ok: false,
      reason: `Free plan is limited to ${FREE_TIER_LIMITS.collections} collections. Upgrade to Pro for unlimited.`
    });
  });

  it("rejects Free users over the collections limit", async () => {
    mockedCollectionStats.mockResolvedValue({
      total: FREE_TIER_LIMITS.collections + 2,
      favorites: 0
    });
    const result = await checkCollectionCapacity("user_free", false);
    expect(result.ok).toBe(false);
  });
});
