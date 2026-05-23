import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn()
}));

vi.mock("@/lib/db/collections", () => ({
  createCollectionForUser: vi.fn(),
  deleteCollectionForUser: vi.fn(),
  updateCollectionForUser: vi.fn(),
  setCollectionFavoriteForUser: vi.fn()
}));

vi.mock("@/lib/billing", () => ({
  getUserIsPro: vi.fn(),
  checkCollectionCapacity: vi.fn()
}));

import { auth } from "@/auth";
import { checkCollectionCapacity, getUserIsPro } from "@/lib/billing";
import {
  createCollectionForUser,
  deleteCollectionForUser,
  setCollectionFavoriteForUser,
  updateCollectionForUser
} from "@/lib/db/collections";
import {
  createCollectionAction,
  deleteCollectionAction,
  setCollectionFavoriteAction,
  updateCollectionAction
} from "@/actions/collections";

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedCreate = createCollectionForUser as unknown as ReturnType<
  typeof vi.fn
>;
const mockedDelete = deleteCollectionForUser as unknown as ReturnType<
  typeof vi.fn
>;
const mockedUpdate = updateCollectionForUser as unknown as ReturnType<
  typeof vi.fn
>;
const mockedSetFavorite = setCollectionFavoriteForUser as unknown as ReturnType<
  typeof vi.fn
>;
const mockedGetUserIsPro = getUserIsPro as unknown as ReturnType<typeof vi.fn>;
const mockedCheckCollectionCapacity =
  checkCollectionCapacity as unknown as ReturnType<typeof vi.fn>;

const signedIn = { user: { id: "user_1", email: "u@example.com" } };

const sampleCollection = {
  id: "coll_1",
  name: "React Patterns",
  description: null,
  isFavorite: false,
  updatedAt: new Date("2026-05-18T00:00:00Z"),
  itemCount: 0,
  dominantType: null,
  types: []
};

describe("createCollectionAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedCreate.mockReset();
    mockedGetUserIsPro.mockReset();
    mockedCheckCollectionCapacity.mockReset();
    // Default Pro + unlimited so existing happy-path tests don't have to
    // opt in — the Free-tier rejection case overrides below.
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedCheckCollectionCapacity.mockResolvedValue({ ok: true });
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await createCollectionAction({ name: "React Patterns" });

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects when name is empty/whitespace", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await createCollectionAction({ name: "   " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Name is required");
    }
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("normalizes input and returns the created collection on success", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedCreate.mockResolvedValue(sampleCollection);

    const result = await createCollectionAction({
      name: "  React Patterns  ",
      description: "   "
    });

    expect(result).toEqual({ success: true, data: sampleCollection });
    expect(mockedCreate).toHaveBeenCalledOnce();
    const [userId, input] = mockedCreate.mock.calls[0];
    expect(userId).toBe("user_1");
    expect(input.name).toBe("React Patterns");
    expect(input.description).toBeNull();
  });

  it("keeps a non-empty trimmed description", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedCreate.mockResolvedValue(sampleCollection);

    await createCollectionAction({
      name: "Hooks",
      description: "  Custom hooks for React  "
    });

    const [, input] = mockedCreate.mock.calls[0];
    expect(input.name).toBe("Hooks");
    expect(input.description).toBe("Custom hooks for React");
  });

  it("returns a generic error when the db function throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedCreate.mockRejectedValue(new Error("db down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createCollectionAction({ name: "React Patterns" });

    expect(result).toEqual({
      success: false,
      error: "Could not create collection. Please try again."
    });

    errSpy.mockRestore();
  });

  it("rejects a Free user at the collection cap", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(false);
    mockedCheckCollectionCapacity.mockResolvedValue({
      ok: false,
      reason:
        "Free plan is limited to 3 collections. Upgrade to Pro for unlimited."
    });

    const result = await createCollectionAction({ name: "Fourth" });

    expect(result).toEqual({
      success: false,
      error:
        "Free plan is limited to 3 collections. Upgrade to Pro for unlimited."
    });
    expect(mockedCheckCollectionCapacity).toHaveBeenCalledWith("user_1", false);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("lets a Pro user create a collection past the Free cap", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(true);
    mockedCheckCollectionCapacity.mockResolvedValue({ ok: true });
    mockedCreate.mockResolvedValue(sampleCollection);

    const result = await createCollectionAction({ name: "Fourth" });

    expect(result.success).toBe(true);
    expect(mockedCheckCollectionCapacity).toHaveBeenCalledWith("user_1", true);
    expect(mockedCreate).toHaveBeenCalledOnce();
  });
});

describe("updateCollectionAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedUpdate.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await updateCollectionAction("coll_1", { name: "New" });

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("rejects when the collection id is empty", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await updateCollectionAction("", { name: "New" });

    expect(result).toEqual({ success: false, error: "Invalid collection id" });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("rejects when the name is empty/whitespace", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await updateCollectionAction("coll_1", { name: "   " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Name is required");
    }
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("normalizes input and forwards to updateCollectionForUser on success", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUpdate.mockResolvedValue(true);

    const result = await updateCollectionAction("coll_1", {
      name: "  React Patterns  ",
      description: "   "
    });

    expect(result).toEqual({ success: true });
    expect(mockedUpdate).toHaveBeenCalledOnce();
    const [userId, id, input] = mockedUpdate.mock.calls[0];
    expect(userId).toBe("user_1");
    expect(id).toBe("coll_1");
    expect(input.name).toBe("React Patterns");
    expect(input.description).toBeNull();
  });

  it("returns not-found when the db reports no row updated", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUpdate.mockResolvedValue(false);

    const result = await updateCollectionAction("coll_other", {
      name: "New name"
    });

    expect(result).toEqual({ success: false, error: "Collection not found" });
  });

  it("returns a generic error when the db function throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUpdate.mockRejectedValue(new Error("db down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await updateCollectionAction("coll_1", { name: "New" });

    expect(result).toEqual({
      success: false,
      error: "Could not update collection. Please try again."
    });

    errSpy.mockRestore();
  });
});

describe("deleteCollectionAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedDelete.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await deleteCollectionAction("coll_1");

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("rejects when the collection id is empty", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await deleteCollectionAction("");

    expect(result).toEqual({ success: false, error: "Invalid collection id" });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("returns not-found when the db reports no row deleted", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedDelete.mockResolvedValue(false);

    const result = await deleteCollectionAction("coll_missing");

    expect(result).toEqual({ success: false, error: "Collection not found" });
  });

  it("returns success when the row was deleted", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedDelete.mockResolvedValue(true);

    const result = await deleteCollectionAction("coll_1");

    expect(result).toEqual({ success: true });
    expect(mockedDelete).toHaveBeenCalledWith("user_1", "coll_1");
  });

  it("returns a generic error when the db function throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedDelete.mockRejectedValue(new Error("db down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteCollectionAction("coll_1");

    expect(result).toEqual({
      success: false,
      error: "Could not delete collection. Please try again."
    });

    errSpy.mockRestore();
  });
});

describe("setCollectionFavoriteAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedSetFavorite.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await setCollectionFavoriteAction("coll_1", true);

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedSetFavorite).not.toHaveBeenCalled();
  });

  it("rejects when collectionId is empty", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await setCollectionFavoriteAction("", true);

    expect(result).toEqual({ success: false, error: "Invalid collection id" });
    expect(mockedSetFavorite).not.toHaveBeenCalled();
  });

  it("returns 'Collection not found' when the db reports nothing was updated", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedSetFavorite.mockResolvedValue(false);

    const result = await setCollectionFavoriteAction("coll_missing", true);

    expect(result).toEqual({ success: false, error: "Collection not found" });
    expect(mockedSetFavorite).toHaveBeenCalledWith(
      "user_1",
      "coll_missing",
      true
    );
  });

  it("returns success and echoes isFavorite when the row was updated", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedSetFavorite.mockResolvedValue(true);

    const result = await setCollectionFavoriteAction("coll_1", true);

    expect(result).toEqual({ success: true, isFavorite: true });
    expect(mockedSetFavorite).toHaveBeenCalledWith("user_1", "coll_1", true);
  });

  it("forwards a false toggle through to the db helper", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedSetFavorite.mockResolvedValue(true);

    const result = await setCollectionFavoriteAction("coll_1", false);

    expect(result).toEqual({ success: true, isFavorite: false });
    expect(mockedSetFavorite).toHaveBeenCalledWith("user_1", "coll_1", false);
  });

  it("returns a generic error when the db function throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedSetFavorite.mockRejectedValue(new Error("db down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await setCollectionFavoriteAction("coll_1", true);

    expect(result).toEqual({
      success: false,
      error: "Could not update favorite. Please try again."
    });

    errSpy.mockRestore();
  });
});
