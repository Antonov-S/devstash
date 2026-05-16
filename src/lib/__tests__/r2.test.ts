import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { keyFromPublicUrl } from "@/lib/r2";

describe("keyFromPublicUrl", () => {
  const originalPublicUrl = process.env.R2_PUBLIC_URL;

  beforeEach(() => {
    process.env.R2_PUBLIC_URL = "https://files.example.com";
  });

  afterEach(() => {
    if (originalPublicUrl === undefined) {
      delete process.env.R2_PUBLIC_URL;
    } else {
      process.env.R2_PUBLIC_URL = originalPublicUrl;
    }
  });

  it("strips the public URL prefix to return the object key", () => {
    expect(
      keyFromPublicUrl("https://files.example.com/uploads/user_1/abc.png")
    ).toBe("uploads/user_1/abc.png");
  });

  it("tolerates a trailing slash on R2_PUBLIC_URL", () => {
    process.env.R2_PUBLIC_URL = "https://files.example.com/";
    expect(
      keyFromPublicUrl("https://files.example.com/uploads/user_1/abc.png")
    ).toBe("uploads/user_1/abc.png");
  });

  it("returns null when the URL does not belong to the configured bucket", () => {
    expect(
      keyFromPublicUrl("https://other.example.com/uploads/user_1/abc.png")
    ).toBeNull();
  });

  it("returns null when R2_PUBLIC_URL is unset", () => {
    delete process.env.R2_PUBLIC_URL;
    expect(
      keyFromPublicUrl("https://files.example.com/uploads/abc.png")
    ).toBeNull();
  });

  it("returns null when the URL is exactly the public URL (no key)", () => {
    expect(keyFromPublicUrl("https://files.example.com/")).toBeNull();
  });

  it("rejects URLs whose host merely starts with the configured host", () => {
    // Without the trailing slash in the prefix check, "files.example.com.evil"
    // would match "files.example.com" — guard against that regression.
    expect(
      keyFromPublicUrl("https://files.example.com.evil/uploads/abc.png")
    ).toBeNull();
  });
});
