import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn()
}));

vi.mock("@/lib/db/folders", () => ({
  createFolderForUser: vi.fn(),
  updateFolderForUser: vi.fn(),
  deleteFolderForUser: vi.fn(),
  moveItemToFolder: vi.fn()
}));

vi.mock("@/lib/billing", () => ({
  getUserIsPro: vi.fn()
}));

import { auth } from "@/auth";
import { getUserIsPro } from "@/lib/billing";
import {
  createFolderForUser,
  deleteFolderForUser,
  moveItemToFolder,
  updateFolderForUser
} from "@/lib/db/folders";
import {
  createFolderAction,
  deleteFolderAction,
  moveItemToFolderAction,
  updateFolderAction
} from "@/actions/folders";

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedCreate = createFolderForUser as unknown as ReturnType<typeof vi.fn>;
const mockedUpdate = updateFolderForUser as unknown as ReturnType<typeof vi.fn>;
const mockedDelete = deleteFolderForUser as unknown as ReturnType<typeof vi.fn>;
const mockedMove = moveItemToFolder as unknown as ReturnType<typeof vi.fn>;
const mockedGetUserIsPro = getUserIsPro as unknown as ReturnType<typeof vi.fn>;

const signedIn = { user: { id: "user_1", email: "u@example.com" } };

const sampleFolder = {
  id: "folder_1",
  name: "Design Assets",
  createdAt: new Date("2026-05-31T00:00:00Z"),
  updatedAt: new Date("2026-05-31T00:00:00Z"),
  itemCount: 0,
  totalSize: 0,
  previewImageUrls: []
};

describe("createFolderAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedCreate.mockReset();
    mockedGetUserIsPro.mockReset();
    mockedGetUserIsPro.mockResolvedValue(true);
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await createFolderAction({ name: "Design Assets" });

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects when name is empty/whitespace", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await createFolderAction({ name: "   " });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Name is required");
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects a name over the max length", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await createFolderAction({ name: "x".repeat(101) });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Name is too long");
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects a Free user before creating", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(false);

    const result = await createFolderAction({ name: "Design Assets" });

    expect(result).toEqual({ success: false, error: "Folders require Pro." });
    expect(mockedGetUserIsPro).toHaveBeenCalledWith("user_1");
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("trims input and returns the created folder on success", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedCreate.mockResolvedValue(sampleFolder);

    const result = await createFolderAction({ name: "  Design Assets  " });

    expect(result).toEqual({ success: true, data: sampleFolder });
    const [userId, input] = mockedCreate.mock.calls[0];
    expect(userId).toBe("user_1");
    expect(input.name).toBe("Design Assets");
  });

  it("returns a generic error when the db function throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedCreate.mockRejectedValue(new Error("db down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createFolderAction({ name: "Design Assets" });

    expect(result).toEqual({
      success: false,
      error: "Could not create folder. Please try again."
    });

    errSpy.mockRestore();
  });
});

describe("updateFolderAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedUpdate.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await updateFolderAction("folder_1", { name: "New" });

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("rejects when the folder id is empty", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await updateFolderAction("", { name: "New" });

    expect(result).toEqual({ success: false, error: "Invalid folder id" });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("returns not-found when the db reports no row updated", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUpdate.mockResolvedValue(false);

    const result = await updateFolderAction("folder_other", { name: "New" });

    expect(result).toEqual({ success: false, error: "Folder not found" });
  });

  it("trims input and forwards to updateFolderForUser on success", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUpdate.mockResolvedValue(true);

    const result = await updateFolderAction("folder_1", { name: "  Renamed  " });

    expect(result).toEqual({ success: true });
    const [userId, id, input] = mockedUpdate.mock.calls[0];
    expect(userId).toBe("user_1");
    expect(id).toBe("folder_1");
    expect(input.name).toBe("Renamed");
  });
});

describe("deleteFolderAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedDelete.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await deleteFolderAction("folder_1");

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("rejects when the folder id is empty", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await deleteFolderAction("");

    expect(result).toEqual({ success: false, error: "Invalid folder id" });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("returns not-found when the db reports no row deleted", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedDelete.mockResolvedValue(false);

    const result = await deleteFolderAction("folder_missing");

    expect(result).toEqual({ success: false, error: "Folder not found" });
  });

  it("returns success when the row was deleted", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedDelete.mockResolvedValue(true);

    const result = await deleteFolderAction("folder_1");

    expect(result).toEqual({ success: true });
    expect(mockedDelete).toHaveBeenCalledWith("user_1", "folder_1");
  });
});

describe("moveItemToFolderAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedMove.mockReset();
    mockedGetUserIsPro.mockReset();
    mockedGetUserIsPro.mockResolvedValue(true);
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await moveItemToFolderAction("item_1", "folder_1");

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedMove).not.toHaveBeenCalled();
  });

  it("rejects a Free user before moving", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedGetUserIsPro.mockResolvedValue(false);

    const result = await moveItemToFolderAction("item_1", "folder_1");

    expect(result).toEqual({ success: false, error: "Folders require Pro." });
    expect(mockedGetUserIsPro).toHaveBeenCalledWith("user_1");
    expect(mockedMove).not.toHaveBeenCalled();
  });

  it("maps a cross-user folder to 'Invalid folder'", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedMove.mockResolvedValue({ ok: false, reason: "invalid-folder" });

    const result = await moveItemToFolderAction("item_1", "folder_other");

    expect(result).toEqual({ success: false, error: "Invalid folder" });
  });

  it("maps a wrong-type item to the file/image message", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedMove.mockResolvedValue({ ok: false, reason: "wrong-type" });

    const result = await moveItemToFolderAction("item_1", "folder_1");

    expect(result).toEqual({
      success: false,
      error: "Only files and images can go in folders."
    });
  });

  it("maps a missing item to 'Item not found'", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedMove.mockResolvedValue({ ok: false, reason: "not-found" });

    const result = await moveItemToFolderAction("item_x", "folder_1");

    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("files an item into a folder on success", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedMove.mockResolvedValue({ ok: true });

    const result = await moveItemToFolderAction("item_1", "folder_1");

    expect(result).toEqual({ success: true });
    expect(mockedMove).toHaveBeenCalledWith("user_1", "item_1", "folder_1");
  });

  it("unfiles an item when folderId is null", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedMove.mockResolvedValue({ ok: true });

    const result = await moveItemToFolderAction("item_1", null);

    expect(result).toEqual({ success: true });
    expect(mockedMove).toHaveBeenCalledWith("user_1", "item_1", null);
  });
});
