import { describe, it, expect } from "vitest";

import {
  extractIp,
  formatRetryAfter,
  rateLimitMessage
} from "@/lib/rate-limit";

function headersOf(record: Record<string, string>) {
  return {
    get(name: string) {
      return record[name.toLowerCase()] ?? null;
    }
  };
}

describe("extractIp", () => {
  it("returns the first entry in x-forwarded-for", () => {
    const h = headersOf({
      "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178"
    });
    expect(extractIp(h)).toBe("203.0.113.7");
  });

  it("trims whitespace around the x-forwarded-for entry", () => {
    const h = headersOf({ "x-forwarded-for": "   203.0.113.7   " });
    expect(extractIp(h)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const h = headersOf({ "x-real-ip": "198.51.100.42" });
    expect(extractIp(h)).toBe("198.51.100.42");
  });

  it("falls back to x-real-ip when x-forwarded-for is empty", () => {
    const h = headersOf({
      "x-forwarded-for": "",
      "x-real-ip": "198.51.100.42"
    });
    expect(extractIp(h)).toBe("198.51.100.42");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    expect(extractIp(headersOf({}))).toBe("unknown");
  });
});

describe("formatRetryAfter", () => {
  it("returns 'a minute' for anything <= 60 seconds", () => {
    expect(formatRetryAfter(0)).toBe("a minute");
    expect(formatRetryAfter(1)).toBe("a minute");
    expect(formatRetryAfter(60)).toBe("a minute");
  });

  it("rounds up to whole minutes between 61s and 1h", () => {
    expect(formatRetryAfter(61)).toBe("2 minutes");
    expect(formatRetryAfter(120)).toBe("2 minutes");
    expect(formatRetryAfter(121)).toBe("3 minutes");
  });

  it("rounds up to whole hours past one hour", () => {
    expect(formatRetryAfter(3600)).toBe("1 hour");
    expect(formatRetryAfter(3601)).toBe("2 hours");
    expect(formatRetryAfter(7200)).toBe("2 hours");
  });
});

describe("rateLimitMessage", () => {
  it("produces a user-friendly message including the retry window", () => {
    const message = rateLimitMessage({
      success: false,
      remaining: 0,
      reset: 0,
      retryAfterSeconds: 90
    });
    expect(message).toBe("Too many attempts. Please try again in 2 minutes.");
  });
});
