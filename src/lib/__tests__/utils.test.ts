import { describe, it, expect } from "vitest";

import { capitalize, cn, parseTags } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy values", () => {
    expect(cn("a", false && "b", null, undefined, "c")).toBe("a c");
  });

  it("merges conflicting tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("supports conditional object/array syntax via clsx", () => {
    expect(cn("base", { hidden: false, block: true }, ["m-2"])).toBe(
      "base block m-2"
    );
  });
});

describe("capitalize", () => {
  it("returns an empty string unchanged", () => {
    expect(capitalize("")).toBe("");
  });

  it("uppercases a single character", () => {
    expect(capitalize("a")).toBe("A");
  });

  it("uppercases only the first character of a word", () => {
    expect(capitalize("snippet")).toBe("Snippet");
  });

  it("leaves an already-capitalized string unchanged", () => {
    expect(capitalize("Snippet")).toBe("Snippet");
  });

  it("does not trim leading whitespace", () => {
    expect(capitalize(" snippet")).toBe(" snippet");
  });
});

describe("parseTags", () => {
  it("returns an empty array for empty input", () => {
    expect(parseTags("")).toEqual([]);
  });

  it("returns an empty array for whitespace and commas only", () => {
    expect(parseTags("  ,  ,  ")).toEqual([]);
  });

  it("splits comma-separated tags and trims whitespace", () => {
    expect(parseTags("react,  next.js , prisma")).toEqual([
      "react",
      "next.js",
      "prisma"
    ]);
  });

  it("dedupes tags while preserving first-seen order", () => {
    expect(parseTags("react, prisma, react, next, prisma")).toEqual([
      "react",
      "prisma",
      "next"
    ]);
  });

  it("returns a single tag when there are no commas", () => {
    expect(parseTags("react")).toEqual(["react"]);
  });
});
