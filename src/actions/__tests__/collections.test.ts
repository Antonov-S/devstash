import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn()
}));

vi.mock("@/lib/db/collections", () => ({
  createCollectionForUser: vi.fn()
}));

import { auth } from "@/auth";
import { createCollectionForUser } from "@/lib/db/collections";
import { createCollectionAction } from "@/actions/collections";

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedCreate = createCollectionForUser as unknown as ReturnType<
  typeof vi.fn
>;

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
});
