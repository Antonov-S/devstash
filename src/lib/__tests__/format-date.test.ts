import { describe, it, expect } from "vitest";

import { formatDateLong } from "@/lib/format-date";

const NOON = (year: number, month: number, day: number) =>
  new Date(year, month, day, 12, 0, 0);

describe("formatDateLong", () => {
  it("returns Today for a date earlier the same local day", () => {
    const now = NOON(2026, 4, 18);
    const earlier = new Date(2026, 4, 18, 0, 30, 0);
    expect(formatDateLong(earlier, now)).toBe("Today");
  });

  it("returns Today for a date later the same local day", () => {
    const now = NOON(2026, 4, 18);
    const later = new Date(2026, 4, 18, 23, 30, 0);
    expect(formatDateLong(later, now)).toBe("Today");
  });

  it("returns Yesterday for one calendar day earlier", () => {
    const now = NOON(2026, 4, 18);
    const yesterday = NOON(2026, 4, 17);
    expect(formatDateLong(yesterday, now)).toBe("Yesterday");
  });

  it("returns Yesterday across a month boundary", () => {
    const now = NOON(2026, 5, 1);
    const yesterday = NOON(2026, 4, 31);
    expect(formatDateLong(yesterday, now)).toBe("Yesterday");
  });

  it("falls back to the long format for two days earlier", () => {
    const now = NOON(2026, 4, 18);
    const twoDaysAgo = NOON(2026, 4, 16);
    expect(formatDateLong(twoDaysAgo, now)).toBe("May 16, 2026");
  });

  it("falls back to the long format for future dates", () => {
    const now = NOON(2026, 4, 18);
    const future = NOON(2026, 4, 25);
    expect(formatDateLong(future, now)).toBe("May 25, 2026");
  });

  it("accepts an ISO string input", () => {
    const now = NOON(2026, 4, 18);
    expect(formatDateLong("2026-05-16T12:00:00", now)).toBe("May 16, 2026");
  });
});
