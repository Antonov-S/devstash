import { describe, expect, it, vi } from "vitest";

// email.ts imports the Resend SDK at module load; stub it so the pure
// resolveFromAddress helper can be imported without resolving the real package.
vi.mock("resend", () => ({ Resend: class {} }));

import { resolveFromAddress } from "@/lib/email";

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
