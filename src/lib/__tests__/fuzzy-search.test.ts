import { describe, expect, it } from "vitest";

import { fuzzyScore, fuzzySearch } from "@/lib/fuzzy-search";

describe("fuzzyScore", () => {
  it("returns 0 when query is empty or whitespace", () => {
    expect(fuzzyScore("", ["anything"])).toBe(0);
    expect(fuzzyScore("   ", ["anything"])).toBe(0);
  });

  it("returns null when no field matches", () => {
    expect(fuzzyScore("zzz", ["hello", "world"])).toBeNull();
  });

  it("ignores null and empty fields", () => {
    expect(fuzzyScore("x", [null, "", "   "])).toBeNull();
    expect(fuzzyScore("hello", [null, "hello world"])).not.toBeNull();
  });

  it("scores exact field equality highest", () => {
    const exact = fuzzyScore("hello", ["hello"]);
    const prefix = fuzzyScore("hello", ["hello world"]);
    expect(exact).not.toBeNull();
    expect(prefix).not.toBeNull();
    expect(exact!).toBeGreaterThan(prefix!);
  });

  it("scores prefix match higher than substring match", () => {
    const prefix = fuzzyScore("foo", ["foobar"]);
    const substring = fuzzyScore("foo", ["xxxfoo"]);
    expect(prefix).not.toBeNull();
    expect(substring).not.toBeNull();
    expect(prefix!).toBeGreaterThan(substring!);
  });

  it("rewards word-boundary matches over arbitrary substring", () => {
    const wordBoundary = fuzzyScore("bar", ["foo bar"]);
    const inner = fuzzyScore("bar", ["foobaz bar"]);
    expect(wordBoundary).not.toBeNull();
    expect(inner).not.toBeNull();
    // both substring but word-boundary path should outrank when applicable
    expect(wordBoundary!).toBeGreaterThanOrEqual(inner!);
  });

  it("is case-insensitive", () => {
    expect(fuzzyScore("HELLO", ["hello world"])).not.toBeNull();
    expect(fuzzyScore("hello", ["Hello World"])).not.toBeNull();
  });

  it("matches as subsequence when no substring is present", () => {
    expect(fuzzyScore("udh", ["use database hook"])).not.toBeNull();
    expect(fuzzyScore("xyz", ["use database hook"])).toBeNull();
  });

  it("rejects loose subsequence matches that aren't word-anchored or consecutive", () => {
    // 'd' and 'e' are consecutive at start, but the 's' lives mid-word in
    // "fast" — not at a word boundary and not adjacent to the previous match.
    expect(
      fuzzyScore("desig", ["debounce a fast-changing value with a configurable delay."])
    ).toBeNull();
  });

  it("only attempts subsequence on the first (title) field", () => {
    // Word-anchored subsequence on the first field is fine.
    expect(fuzzyScore("udh", ["use database hook", "snippet"])).not.toBeNull();
    // But the same query as a subsequence of a later field should not match.
    expect(fuzzyScore("udh", ["totally unrelated", "use database hook"])).toBeNull();
  });

  it("ranks earlier fields above later ones at the same base tier", () => {
    const titleHit = fuzzyScore("foo", ["foo", "bar"]);
    const descHit = fuzzyScore("foo", ["bar", "foo"]);
    expect(titleHit).not.toBeNull();
    expect(descHit).not.toBeNull();
    expect(titleHit!).toBeGreaterThan(descHit!);
  });
});

describe("fuzzySearch", () => {
  type Row = { id: string; title: string; type?: string };
  const rows: Row[] = [
    { id: "1", title: "useDebounce hook", type: "snippet" },
    { id: "2", title: "React component template", type: "snippet" },
    { id: "3", title: "Daily standup notes", type: "note" },
    { id: "4", title: "shadcn install", type: "command" }
  ];

  const fieldsOf = (r: Row) => [r.title, r.type];

  it("returns all items in original order when query is blank", () => {
    const out = fuzzySearch("", rows, fieldsOf);
    expect(out.map((m) => m.item.id)).toEqual(["1", "2", "3", "4"]);
  });

  it("respects limit on blank query", () => {
    const out = fuzzySearch("", rows, fieldsOf, 2);
    expect(out).toHaveLength(2);
    expect(out.map((m) => m.item.id)).toEqual(["1", "2"]);
  });

  it("filters out non-matching rows and orders by score desc", () => {
    const out = fuzzySearch("snip", rows, fieldsOf);
    expect(out.map((m) => m.item.id)).toEqual(["1", "2"]);
    expect(out[0]!.score).toBeGreaterThanOrEqual(out[1]!.score);
  });

  it("returns an empty array when nothing matches", () => {
    const out = fuzzySearch("zzz-no-match", rows, fieldsOf);
    expect(out).toEqual([]);
  });

  it("respects limit on filtered results", () => {
    const out = fuzzySearch("e", rows, fieldsOf, 2);
    expect(out).toHaveLength(2);
  });
});
