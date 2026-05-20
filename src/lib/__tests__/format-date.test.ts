import { describe, it, expect } from "vitest";

import {
  formatDateLong,
  formatDateMedium,
  formatDateRelative,
  formatDateShort
} from "@/lib/format-date";

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

describe("formatDateShort", () => {
  it("returns Today for the same local day", () => {
    const now = NOON(2026, 4, 18);
    expect(formatDateShort(now, now)).toBe("Today");
  });

  it("returns Yesterday for one calendar day earlier", () => {
    const now = NOON(2026, 4, 18);
    const yesterday = NOON(2026, 4, 17);
    expect(formatDateShort(yesterday, now)).toBe("Yesterday");
  });

  it("falls back to a no-year short format for older dates", () => {
    const now = NOON(2026, 4, 18);
    const twoDaysAgo = NOON(2026, 4, 16);
    expect(formatDateShort(twoDaysAgo, now)).toBe("May 16");
  });

  it("falls back to the short format for future dates", () => {
    const now = NOON(2026, 4, 18);
    const future = NOON(2026, 4, 25);
    expect(formatDateShort(future, now)).toBe("May 25");
  });
});

describe("formatDateMedium", () => {
  it("returns Today for the same local day", () => {
    const now = NOON(2026, 4, 18);
    expect(formatDateMedium(now, now)).toBe("Today");
  });

  it("returns Yesterday for one calendar day earlier", () => {
    const now = NOON(2026, 4, 18);
    const yesterday = NOON(2026, 4, 17);
    expect(formatDateMedium(yesterday, now)).toBe("Yesterday");
  });

  it("falls back to a short-month-with-year form for older dates", () => {
    const now = NOON(2026, 4, 18);
    const twoDaysAgo = NOON(2026, 4, 16);
    expect(formatDateMedium(twoDaysAgo, now)).toBe("May 16, 2026");
  });

  it("falls back to the medium format for future dates", () => {
    const now = NOON(2026, 4, 18);
    const future = NOON(2026, 4, 25);
    expect(formatDateMedium(future, now)).toBe("May 25, 2026");
  });
});

describe("formatDateRelative", () => {
  it("returns Today for the same local day", () => {
    const now = NOON(2026, 4, 18);
    expect(formatDateRelative(now, now)).toBe("Today");
  });

  it("returns Yesterday for one calendar day earlier", () => {
    const now = NOON(2026, 4, 18);
    const yesterday = NOON(2026, 4, 17);
    expect(formatDateRelative(yesterday, now)).toBe("Yesterday");
  });

  it("returns N days ago for 2–6 days earlier", () => {
    const now = NOON(2026, 4, 18);
    expect(formatDateRelative(NOON(2026, 4, 16), now)).toBe("2 days ago");
    expect(formatDateRelative(NOON(2026, 4, 12), now)).toBe("6 days ago");
  });

  it("returns 1 week ago for 7–13 days earlier", () => {
    const now = NOON(2026, 4, 18);
    expect(formatDateRelative(NOON(2026, 4, 11), now)).toBe("1 week ago");
    expect(formatDateRelative(NOON(2026, 4, 5), now)).toBe("1 week ago");
  });

  it("returns N weeks ago for 14–27 days earlier", () => {
    const now = NOON(2026, 4, 28);
    expect(formatDateRelative(NOON(2026, 4, 14), now)).toBe("2 weeks ago");
    expect(formatDateRelative(NOON(2026, 4, 7), now)).toBe("3 weeks ago");
  });

  it("returns N months ago for 28–364 days earlier", () => {
    const now = NOON(2026, 4, 18);
    expect(formatDateRelative(NOON(2026, 3, 18), now)).toBe("1 month ago");
    expect(formatDateRelative(NOON(2026, 1, 18), now)).toBe("2 months ago");
  });

  it("falls back to Mon D, YYYY for very old dates", () => {
    const now = NOON(2026, 4, 18);
    const ancient = NOON(2024, 0, 5);
    expect(formatDateRelative(ancient, now)).toBe("Jan 5, 2024");
  });

  it("falls back to Mon D, YYYY for future dates", () => {
    const now = NOON(2026, 4, 18);
    const future = NOON(2026, 4, 25);
    expect(formatDateRelative(future, now)).toBe("May 25, 2026");
  });
});
