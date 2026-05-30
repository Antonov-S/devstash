import { describe, expect, it, vi } from "vitest";

// email.ts imports the Resend SDK at module load; stub it so the pure
// resolveFromAddress helper can be imported without resolving the real package.
vi.mock("resend", () => ({ Resend: class {} }));

import { formatSendError, normalizeApiKey, resolveFromAddress } from "@/lib/email";

describe("resolveFromAddress", () => {
  it("uses EMAIL_FROM when set", () => {
    expect(
      resolveFromAddress({
        nodeEnv: "production",
        emailFrom: "DevStash <noreply@devstash.xyz>"
      })
    ).toBe("DevStash <noreply@devstash.xyz>");
  });

  it("trims surrounding whitespace from EMAIL_FROM", () => {
    expect(
      resolveFromAddress({
        nodeEnv: "development",
        emailFrom: "  DevStash <noreply@devstash.xyz>  "
      })
    ).toBe("DevStash <noreply@devstash.xyz>");
  });

  it("falls back to the sandbox sender outside production when EMAIL_FROM is unset", () => {
    expect(
      resolveFromAddress({ nodeEnv: "development", emailFrom: undefined })
    ).toBe("DevStash <onboarding@resend.dev>");
  });

  it("treats a whitespace-only EMAIL_FROM as unset (sandbox in dev)", () => {
    expect(resolveFromAddress({ nodeEnv: "test", emailFrom: "   " })).toBe(
      "DevStash <onboarding@resend.dev>"
    );
  });

  it("throws in production when EMAIL_FROM is unset", () => {
    expect(() =>
      resolveFromAddress({ nodeEnv: "production", emailFrom: undefined })
    ).toThrow(/EMAIL_FROM must be set in production/);
  });

  it("throws in production when EMAIL_FROM is whitespace-only", () => {
    expect(() =>
      resolveFromAddress({ nodeEnv: "production", emailFrom: "  " })
    ).toThrow(/EMAIL_FROM must be set in production/);
  });
});

describe("normalizeApiKey", () => {
  it("returns undefined for unset/empty/whitespace input", () => {
    expect(normalizeApiKey(undefined)).toBeUndefined();
    expect(normalizeApiKey("")).toBeUndefined();
    expect(normalizeApiKey("   ")).toBeUndefined();
  });

  it("passes a clean key through unchanged", () => {
    expect(normalizeApiKey("re_abc123")).toBe("re_abc123");
  });

  it("strips surrounding double and single quotes", () => {
    expect(normalizeApiKey('"re_abc123"')).toBe("re_abc123");
    expect(normalizeApiKey("'re_abc123'")).toBe("re_abc123");
  });

  it("strips surrounding whitespace and trailing newline", () => {
    expect(normalizeApiKey("  re_abc123\n")).toBe("re_abc123");
  });
});

describe("formatSendError", () => {
  it("names the sender it tried", () => {
    const msg = formatSendError(
      { message: "Something broke" },
      "DevStash <noreply@devstash.xyz>"
    );
    expect(msg).toContain('from "DevStash <noreply@devstash.xyz>"');
    expect(msg).toContain("Something broke");
  });

  it("adds an API-key hint for an invalid-key error", () => {
    const msg = formatSendError(
      { message: "API key is invalid" },
      "DevStash <noreply@devstash.xyz>"
    );
    expect(msg).toMatch(/RESEND_API_KEY belongs to the SAME Resend account/);
  });

  it("adds a domain hint for an unverified-domain error", () => {
    const msg = formatSendError(
      { message: "The devstash.xyz domain is not verified" },
      "DevStash <noreply@devstash.xyz>"
    );
    expect(msg).toMatch(/not on a verified domain/);
  });

  it("falls back to 'unknown error' when no message is present", () => {
    expect(formatSendError({}, "x@y.com")).toContain("unknown error");
  });
});
