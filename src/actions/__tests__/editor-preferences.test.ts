import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn()
}));

vi.mock("@/lib/db/users", () => ({
  updateUserEditorPreferences: vi.fn()
}));

import { auth } from "@/auth";
import { updateUserEditorPreferences } from "@/lib/db/users";
import { updateEditorPreferencesAction } from "@/actions/editor-preferences";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedUpdate = updateUserEditorPreferences as unknown as ReturnType<
  typeof vi.fn
>;

const signedIn = { user: { id: "user_1", email: "u@example.com" } };

const validPayload = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "monokai" as const
};

describe("updateEditorPreferencesAction", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedUpdate.mockReset();
  });

  it("rejects when there is no session", async () => {
    mockedAuth.mockResolvedValue(null);

    const result = await updateEditorPreferencesAction(validPayload);

    expect(result).toEqual({ success: false, error: "You are not signed in." });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("rejects an invalid theme", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await updateEditorPreferencesAction({
      ...validPayload,
      theme: "dracula"
    });

    expect(result.success).toBe(false);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("rejects an out-of-allowlist fontSize", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await updateEditorPreferencesAction({
      ...validPayload,
      fontSize: 99
    });

    expect(result.success).toBe(false);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("rejects a non-object payload", async () => {
    mockedAuth.mockResolvedValue(signedIn);

    const result = await updateEditorPreferencesAction("nope");

    expect(result.success).toBe(false);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("forwards the parsed payload and returns the saved row on success", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUpdate.mockResolvedValue(validPayload);

    const result = await updateEditorPreferencesAction(validPayload);

    expect(result).toEqual({ success: true, data: validPayload });
    expect(mockedUpdate).toHaveBeenCalledOnce();
    const [userId, input] = mockedUpdate.mock.calls[0];
    expect(userId).toBe("user_1");
    expect(input).toEqual(validPayload);
  });

  it("returns a generic error when the db helper throws", async () => {
    mockedAuth.mockResolvedValue(signedIn);
    mockedUpdate.mockRejectedValue(new Error("db down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await updateEditorPreferencesAction(DEFAULT_EDITOR_PREFERENCES);

    expect(result).toEqual({
      success: false,
      error: "Could not save editor preferences. Please try again."
    });

    errSpy.mockRestore();
  });
});
