import { describe, it, expect } from "vitest";

import { DEFAULT_REDIRECT, safeRedirectPath } from "@/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it("returns the fallback for non-string input", () => {
    expect(safeRedirectPath(null)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath(42)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath({})).toBe(DEFAULT_REDIRECT);
  });

  it("returns the fallback for an empty string", () => {
    expect(safeRedirectPath("")).toBe(DEFAULT_REDIRECT);
  });

  it("accepts a same-origin absolute path", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/items/snippets")).toBe("/items/snippets");
    expect(safeRedirectPath("/profile?tab=usage")).toBe("/profile?tab=usage");
  });

  it("rejects absolute URLs (http/https)", () => {
    expect(safeRedirectPath("https://evil.com/foo")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("http://evil.com")).toBe(DEFAULT_REDIRECT);
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeRedirectPath("//evil.com")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("//evil.com/dashboard")).toBe(DEFAULT_REDIRECT);
  });

  it("rejects backslash-prefixed paths that some parsers treat as protocol-relative", () => {
    expect(safeRedirectPath("/\\evil.com")).toBe(DEFAULT_REDIRECT);
  });

  it("rejects relative paths without a leading slash", () => {
    expect(safeRedirectPath("dashboard")).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath("javascript:alert(1)")).toBe(DEFAULT_REDIRECT);
  });

  it("uses a custom fallback when provided", () => {
    expect(safeRedirectPath("https://evil.com", "/sign-in")).toBe("/sign-in");
    expect(safeRedirectPath(null, "/home")).toBe("/home");
  });
});
