import { describe, it, expect } from "vitest";

import {
  buildPageHref,
  buildPageList,
  paginate,
  parsePageParam
} from "@/lib/pagination";

describe("parsePageParam", () => {
  it("returns 1 for undefined", () => {
    expect(parsePageParam(undefined)).toBe(1);
  });

  it("returns 1 for empty string", () => {
    expect(parsePageParam("")).toBe(1);
  });

  it("returns 1 for non-numeric input", () => {
    expect(parsePageParam("abc")).toBe(1);
  });

  it("returns 1 for zero or negative numbers", () => {
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-5")).toBe(1);
  });

  it("parses a positive integer", () => {
    expect(parsePageParam("3")).toBe(3);
  });

  it("uses the first entry when given an array", () => {
    expect(parsePageParam(["7", "9"])).toBe(7);
  });
});

describe("paginate", () => {
  it("returns currentPage 1 / totalPages 1 when totalCount is 0", () => {
    expect(paginate({ page: 1, perPage: 21, totalCount: 0 })).toEqual({
      currentPage: 1,
      totalPages: 1,
      skip: 0,
      take: 21
    });
  });

  it("computes totalPages by ceiling totalCount / perPage", () => {
    expect(paginate({ page: 1, perPage: 21, totalCount: 22 })).toEqual({
      currentPage: 1,
      totalPages: 2,
      skip: 0,
      take: 21
    });
  });

  it("clamps page to totalPages when out of range above", () => {
    const result = paginate({ page: 99, perPage: 21, totalCount: 42 });
    expect(result.currentPage).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.skip).toBe(21);
  });

  it("clamps page to 1 when below 1", () => {
    const result = paginate({ page: -3, perPage: 21, totalCount: 100 });
    expect(result.currentPage).toBe(1);
    expect(result.skip).toBe(0);
  });

  it("computes skip as (currentPage - 1) * perPage", () => {
    expect(
      paginate({ page: 3, perPage: 21, totalCount: 200 }).skip
    ).toBe(42);
  });
});

describe("buildPageList", () => {
  it("returns all pages when totalPages <= 7", () => {
    expect(buildPageList(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPageList(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("inserts an end ellipsis when current is near the start", () => {
    expect(buildPageList(2, 10)).toEqual([1, 2, 3, "ellipsis-end", 10]);
  });

  it("inserts a start ellipsis when current is near the end", () => {
    expect(buildPageList(9, 10)).toEqual([1, "ellipsis-start", 8, 9, 10]);
  });

  it("inserts both ellipses when current is in the middle", () => {
    expect(buildPageList(5, 10)).toEqual([
      1,
      "ellipsis-start",
      4,
      5,
      6,
      "ellipsis-end",
      10
    ]);
  });

  it("handles totalPages exactly 8 with current in middle", () => {
    expect(buildPageList(4, 8)).toEqual([
      1,
      "ellipsis-start",
      3,
      4,
      5,
      "ellipsis-end",
      8
    ]);
  });
});

describe("buildPageHref", () => {
  it("returns the bare href for page 1", () => {
    expect(buildPageHref("/items/snippets", 1)).toBe("/items/snippets");
  });

  it("appends ?page=N for page > 1", () => {
    expect(buildPageHref("/items/snippets", 3)).toBe(
      "/items/snippets?page=3"
    );
  });

  it("uses & when the base href already has a query string", () => {
    expect(buildPageHref("/items/snippets?sort=asc", 2)).toBe(
      "/items/snippets?sort=asc&page=2"
    );
  });
});
