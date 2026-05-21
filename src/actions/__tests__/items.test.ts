import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn()
}));

vi.mock("@/lib/db/items", () => ({
  createItemForUser: vi.fn(),
  updateItemForUser: vi.fn(),
  deleteItemForUser: vi.fn(),
  setItemFavoriteForUser: vi.fn(),
  setItemPinnedForUser: vi.fn()
}));

vi.mock("@/lib/db/collections", () => ({
  verifyCollectionsOwnedByUser: vi.fn()
}));

vi.mock("@/lib/r2", () => ({
  keyFromPublicUrl: vi.fn()
}));

import { auth } from "@/auth";
import { verifyCollectionsOwnedByUser } from "@/lib/db/collections";
import {
  createItemForUser,
  deleteItemForUser,
  setItemFavoriteForUser,
  setItemPinnedForUser,
  updateItemForUser
} from "@/lib/db/items";
import { keyFromPublicUrl } from "@/lib/r2";
import {
  createItemAction,
  deleteItemAction,
  setItemFavoriteAction,
  setItemPinnedAction,
  updateItemAction
} from "@/actions/items";

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedCreate = createItemForUser as unknown as ReturnType<typeof vi.fn>;
const mockedUpdate = updateItemForUser as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = deleteItemForUser as unknown as ReturnType<typeof vi.fn>;
const mockedSetFavorite = setItemFavoriteForUser as unknown as ReturnType<
  typeof vi.fn
>;
const mockedSetPinned = setItemPinnedForUser as unknown as ReturnType<
  typeof vi.fn
>;
const mockedVerifyCollections =
  verifyCollectionsOwnedByUser as unknown as ReturnType<typeof vi.fn>;
const mockedKeyFromPublicUrl = keyFromPublicUrl as unknown as ReturnType<
  typeof vi.fn
>;

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
    mockedVerifyCollections.mockReset();
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
    expect(data.collectionIds).toEqual([]);
    expect(mockedVerifyCollections).not.toHaveBeenCalled();
  });

  it("dedupes collectionIds, verifies ownership, and forwards them", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUpdate.mockResolvedValue(sampleDetail);
    mockedVerifyCollections.mockResolvedValue(true);

    await updateItemAction("item_1", {
      title: "Hi",
      tags: [],
      collectionIds: ["coll_1", "coll_2", "coll_1"]
    });

    expect(mockedVerifyCollections).toHaveBeenCalledWith("user_1", [
      "coll_1",
      "coll_2"
    ]);
    const [, , data] = mockedUpdate.mock.calls[0];
    expect(data.collectionIds).toEqual(["coll_1", "coll_2"]);
  });

  it("rejects when a collectionId is not owned by the user", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedVerifyCollections.mockResolvedValue(false);

    const result = await updateItemAction("item_1", {
      title: "Hi",
      tags: [],
      collectionIds: ["coll_other"]
    });

    expect(result).toEqual({ success: false, error: "Invalid collection" });
    expect(mockedUpdate).not.toHaveBeenCalled();
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

describe("createItemAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedCreate.mockReset();
    mockedKeyFromPublicUrl.mockReset();
    mockedVerifyCollections.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await createItemAction({
      type: "snippet",
      title: "Hi",
      tags: []
    });

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects when title is empty/whitespace", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await createItemAction({
      type: "snippet",
      title: "   ",
      tags: []
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Title is required");
    }
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects link items without a URL", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await createItemAction({
      type: "link",
      title: "My Link",
      url: null,
      tags: []
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("URL is required");
    }
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid URLs", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await createItemAction({
      type: "link",
      title: "Bad",
      url: "not-a-url",
      tags: []
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid URL");
    }
  });

  it("normalizes input and drops fields irrelevant to the chosen type", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedCreate.mockResolvedValue(sampleDetail);

    const result = await createItemAction({
      type: "note",
      title: "  My Note  ",
      description: "   ",
      content: "  body  ",
      url: "https://example.com",
      language: "typescript",
      tags: ["a", " a ", "", "b"]
    });

    expect(result).toEqual({ success: true, data: sampleDetail });
    expect(mockedCreate).toHaveBeenCalledOnce();
    const [userId, input] = mockedCreate.mock.calls[0];
    expect(userId).toBe("user_1");
    expect(input.typeName).toBe("note");
    expect(input.title).toBe("My Note");
    expect(input.description).toBeNull();
    expect(input.content).toBe("body");
    expect(input.url).toBeNull();
    expect(input.language).toBeNull();
    // dedup happens in the db helper, not the action
    expect(input.tags).toEqual(["a", "a", "b"]);
  });

  it("keeps URL for link type and clears content/language", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedCreate.mockResolvedValue(sampleDetail);

    await createItemAction({
      type: "link",
      title: "Docs",
      content: "ignored",
      url: "https://example.com",
      language: "ignored",
      tags: []
    });

    const [, input] = mockedCreate.mock.calls[0];
    expect(input.typeName).toBe("link");
    expect(input.content).toBeNull();
    expect(input.url).toBe("https://example.com");
    expect(input.language).toBeNull();
  });

  it("keeps language for snippet/command", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedCreate.mockResolvedValue(sampleDetail);

    await createItemAction({
      type: "snippet",
      title: "useAuth",
      content: "const x = 1",
      language: "typescript",
      tags: []
    });

    const [, input] = mockedCreate.mock.calls[0];
    expect(input.language).toBe("typescript");
    expect(input.content).toBe("const x = 1");
  });

  it("rejects file/image without uploaded metadata", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await createItemAction({
      type: "file",
      title: "Report",
      tags: []
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("File upload is required");
    }
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects file/image uploads with a negative or non-integer fileSize", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await createItemAction({
      type: "file",
      title: "Report",
      fileUrl: "https://files.example.com/uploads/user_1/abc.pdf",
      fileName: "report.pdf",
      fileSize: -1,
      tags: []
    });

    expect(result.success).toBe(false);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("keeps fileUrl/fileName/fileSize for file/image and drops irrelevant fields", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedCreate.mockResolvedValue(sampleDetail);
    mockedKeyFromPublicUrl.mockReturnValue("uploads/user_1/abc.png");

    await createItemAction({
      type: "image",
      title: "Logo",
      content: "ignored",
      url: "https://example.com",
      language: "ignored",
      fileUrl: "https://files.example.com/uploads/user_1/abc.png",
      fileName: "logo.png",
      fileSize: 2048,
      tags: []
    });

    const [, input] = mockedCreate.mock.calls[0];
    expect(input.typeName).toBe("image");
    expect(input.fileUrl).toBe(
      "https://files.example.com/uploads/user_1/abc.png"
    );
    expect(input.fileName).toBe("logo.png");
    expect(input.fileSize).toBe(2048);
    expect(input.content).toBeNull();
    expect(input.url).toBeNull();
    expect(input.language).toBeNull();
  });

  it("rejects file/image whose fileUrl belongs to another user", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedKeyFromPublicUrl.mockReturnValue("uploads/user_other/abc.png");

    const result = await createItemAction({
      type: "image",
      title: "Stolen",
      fileUrl: "https://files.example.com/uploads/user_other/abc.png",
      fileName: "stolen.png",
      fileSize: 1024,
      tags: []
    });

    expect(result).toEqual({ success: false, error: "Invalid file upload" });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects file/image whose fileUrl is not in our bucket", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedKeyFromPublicUrl.mockReturnValue(null);

    const result = await createItemAction({
      type: "file",
      title: "External",
      fileUrl: "https://attacker.example.com/uploads/user_1/abc.pdf",
      fileName: "evil.pdf",
      fileSize: 1024,
      tags: []
    });

    expect(result).toEqual({ success: false, error: "Invalid file upload" });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects file/image whose key is a prefix-confusion variant of the user id", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    // userId is "user_1" — make sure "user_1foo" doesn't slip through.
    mockedKeyFromPublicUrl.mockReturnValue("uploads/user_1foo/abc.png");

    const result = await createItemAction({
      type: "image",
      title: "Tricky",
      fileUrl: "https://files.example.com/uploads/user_1foo/abc.png",
      fileName: "tricky.png",
      fileSize: 1024,
      tags: []
    });

    expect(result).toEqual({ success: false, error: "Invalid file upload" });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("returns 'Item type not found' when the db reports no matching system type", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedCreate.mockResolvedValue(null);

    const result = await createItemAction({
      type: "snippet",
      title: "Hi",
      tags: []
    });

    expect(result).toEqual({ success: false, error: "Item type not found" });
  });

  it("dedupes collectionIds, verifies ownership, and forwards them", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedCreate.mockResolvedValue(sampleDetail);
    mockedVerifyCollections.mockResolvedValue(true);

    await createItemAction({
      type: "snippet",
      title: "Hi",
      tags: [],
      collectionIds: ["coll_1", "coll_2", "coll_1"]
    });

    expect(mockedVerifyCollections).toHaveBeenCalledWith("user_1", [
      "coll_1",
      "coll_2"
    ]);
    const [, input] = mockedCreate.mock.calls[0];
    expect(input.collectionIds).toEqual(["coll_1", "coll_2"]);
  });

  it("rejects when a collectionId is not owned by the user", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedVerifyCollections.mockResolvedValue(false);

    const result = await createItemAction({
      type: "snippet",
      title: "Hi",
      tags: [],
      collectionIds: ["coll_other"]
    });

    expect(result).toEqual({ success: false, error: "Invalid collection" });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("skips the ownership check when no collectionIds are supplied", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedCreate.mockResolvedValue(sampleDetail);

    await createItemAction({
      type: "snippet",
      title: "Hi",
      tags: []
    });

    expect(mockedVerifyCollections).not.toHaveBeenCalled();
    const [, input] = mockedCreate.mock.calls[0];
    expect(input.collectionIds).toEqual([]);
  });

  it("returns a generic error when the db function throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedCreate.mockRejectedValue(new Error("db down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createItemAction({
      type: "snippet",
      title: "Hi",
      tags: []
    });

    expect(result).toEqual({
      success: false,
      error: "Could not create item. Please try again."
    });

    errSpy.mockRestore();
  });
});

describe("deleteItemAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedDelete.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await deleteItemAction("item_1");

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("rejects when itemId is empty", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await deleteItemAction("");

    expect(result).toEqual({ success: false, error: "Invalid item id" });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("returns 'Item not found' when the db reports nothing was deleted", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedDelete.mockResolvedValue(false);

    const result = await deleteItemAction("item_missing");

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mockedDelete).toHaveBeenCalledWith("user_1", "item_missing");
  });

  it("returns success when the delete succeeds", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedDelete.mockResolvedValue(true);

    const result = await deleteItemAction("item_1");

    expect(result).toEqual({ success: true });
    expect(mockedDelete).toHaveBeenCalledWith("user_1", "item_1");
  });

  it("returns a generic error when the db function throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedDelete.mockRejectedValue(new Error("db down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteItemAction("item_1");

    expect(result).toEqual({
      success: false,
      error: "Could not delete item. Please try again."
    });

    errSpy.mockRestore();
  });
});

describe("setItemFavoriteAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedSetFavorite.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await setItemFavoriteAction("item_1", true);

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedSetFavorite).not.toHaveBeenCalled();
  });

  it("rejects when itemId is empty", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await setItemFavoriteAction("", true);

    expect(result).toEqual({ success: false, error: "Invalid item id" });
    expect(mockedSetFavorite).not.toHaveBeenCalled();
  });

  it("returns 'Item not found' when the db reports nothing was updated", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedSetFavorite.mockResolvedValue(false);

    const result = await setItemFavoriteAction("item_missing", true);

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mockedSetFavorite).toHaveBeenCalledWith("user_1", "item_missing", true);
  });

  it("returns success and echoes isFavorite when the row was updated", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedSetFavorite.mockResolvedValue(true);

    const result = await setItemFavoriteAction("item_1", true);

    expect(result).toEqual({ success: true, isFavorite: true });
    expect(mockedSetFavorite).toHaveBeenCalledWith("user_1", "item_1", true);
  });

  it("forwards a false toggle through to the db helper", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedSetFavorite.mockResolvedValue(true);

    const result = await setItemFavoriteAction("item_1", false);

    expect(result).toEqual({ success: true, isFavorite: false });
    expect(mockedSetFavorite).toHaveBeenCalledWith("user_1", "item_1", false);
  });

  it("returns a generic error when the db function throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedSetFavorite.mockRejectedValue(new Error("db down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await setItemFavoriteAction("item_1", true);

    expect(result).toEqual({
      success: false,
      error: "Could not update favorite. Please try again."
    });

    errSpy.mockRestore();
  });
});

describe("setItemPinnedAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedSetPinned.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await setItemPinnedAction("item_1", true);

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedSetPinned).not.toHaveBeenCalled();
  });

  it("rejects when itemId is empty", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await setItemPinnedAction("", true);

    expect(result).toEqual({ success: false, error: "Invalid item id" });
    expect(mockedSetPinned).not.toHaveBeenCalled();
  });

  it("returns 'Item not found' when the db reports nothing was updated", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedSetPinned.mockResolvedValue(false);

    const result = await setItemPinnedAction("item_missing", true);

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mockedSetPinned).toHaveBeenCalledWith("user_1", "item_missing", true);
  });

  it("returns success and echoes isPinned when the row was updated", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedSetPinned.mockResolvedValue(true);

    const result = await setItemPinnedAction("item_1", true);

    expect(result).toEqual({ success: true, isPinned: true });
    expect(mockedSetPinned).toHaveBeenCalledWith("user_1", "item_1", true);
  });

  it("forwards a false toggle through to the db helper", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedSetPinned.mockResolvedValue(true);

    const result = await setItemPinnedAction("item_1", false);

    expect(result).toEqual({ success: true, isPinned: false });
    expect(mockedSetPinned).toHaveBeenCalledWith("user_1", "item_1", false);
  });

  it("returns a generic error when the db function throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedSetPinned.mockRejectedValue(new Error("db down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await setItemPinnedAction("item_1", true);

    expect(result).toEqual({
      success: false,
      error: "Could not update pin. Please try again."
    });

    errSpy.mockRestore();
  });
});
