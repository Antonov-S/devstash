import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn()
}));

vi.mock("@/lib/db/items", () => ({
  updateItemForUser: vi.fn()
}));

import { auth } from "@/auth";
import { updateItemForUser } from "@/lib/db/items";
import { updateItemAction } from "@/actions/items";

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedUpdate = updateItemForUser as unknown as ReturnType<typeof vi.fn>;

const signedIn = { user: { id: "user_1", email: "u@example.com" } };

const sampleDetail = {
  id: "item_1",
  title: "Updated",
  description: null,
  language: null,
  isFavorite: false,
  isPinned: false,
  lastUsedAt: null,
  updatedAt: new Date(),
  createdAt: new Date(),
  contentType: "TEXT" as const,
  content: "x",
  fileUrl: null,
  fileName: null,
  fileSize: null,
  url: null,
  itemType: { id: "t_1", name: "snippet", icon: "Code", color: "#3b82f6" },
  tags: [],
  collections: []
};

describe("updateItemAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedUpdate.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await updateItemAction("item_1", {
      title: "Hi",
      tags: []
    });

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("rejects when itemId is empty", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await updateItemAction("", { title: "Hi", tags: [] });

    expect(result).toEqual({ success: false, error: "Invalid item id" });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("rejects when title is empty/whitespace", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await updateItemAction("item_1", {
      title: "   ",
      tags: []
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Title is required");
    }
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("rejects invalid URLs", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await updateItemAction("item_1", {
      title: "Hi",
      url: "not-a-url",
      tags: []
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid URL");
    }
  });

  it("returns 'Item not found' when the db update reports the item is missing", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUpdate.mockResolvedValue(null);

    const result = await updateItemAction("item_missing", {
      title: "Hi",
      tags: []
    });

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mockedUpdate).toHaveBeenCalledOnce();
  });

  it("normalizes input and returns the updated detail on success", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUpdate.mockResolvedValue(sampleDetail);

    const result = await updateItemAction("item_1", {
      title: "  Updated  ",
      description: "   ",
      content: "code",
      language: "  ts ",
      tags: ["react", " hooks ", "", "react"],
      url: null
    });

    expect(result).toEqual({ success: true, data: sampleDetail });
    expect(mockedUpdate).toHaveBeenCalledOnce();
    const [userId, itemId, data] = mockedUpdate.mock.calls[0];
    expect(userId).toBe("user_1");
    expect(itemId).toBe("item_1");
    expect(data.title).toBe("Updated");
    expect(data.description).toBeNull();
    expect(data.content).toBe("code");
    expect(data.language).toBe("ts");
    expect(data.tags).toEqual(["react", "hooks", "react"]);
  });

  it("returns a generic error when the db function throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUpdate.mockRejectedValue(new Error("db down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await updateItemAction("item_1", {
      title: "Hi",
      tags: []
    });

    expect(result).toEqual({
      success: false,
      error: "Could not update item. Please try again."
    });

    errSpy.mockRestore();
  });
});
