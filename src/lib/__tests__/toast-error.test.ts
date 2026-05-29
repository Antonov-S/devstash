import { describe, it, expect, vi, beforeEach } from "vitest";

import { toastActionError } from "@/lib/toast-error";

const error = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => error(...args)
  }
}));

beforeEach(() => {
  error.mockClear();
});

describe("toastActionError", () => {
  it("shows a plain error toast when no onUpgrade is supplied", () => {
    toastActionError("Something went wrong.");
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("Something went wrong.");
  });

  it("shows a plain error toast for a non-Pro error even with onUpgrade", () => {
    const onUpgrade = vi.fn();
    toastActionError("Title is required.", onUpgrade);
    expect(error).toHaveBeenCalledWith("Title is required.");
    expect(onUpgrade).not.toHaveBeenCalled();
  });

  it("adds an Upgrade action when the error mentions Pro and onUpgrade is supplied", () => {
    const onUpgrade = vi.fn();
    toastActionError("File uploads require Pro.", onUpgrade);
    expect(error).toHaveBeenCalledTimes(1);
    const [message, options] = error.mock.calls[0] as [
      string,
      { action: { label: string; onClick: () => void } }
    ];
    expect(message).toBe("File uploads require Pro.");
    expect(options.action.label).toBe("Upgrade");
    options.action.onClick();
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it("shows a plain error toast for a Pro error when onUpgrade is omitted", () => {
    toastActionError("File uploads require Pro.");
    expect(error).toHaveBeenCalledWith("File uploads require Pro.");
  });
});
