import { describe, it, expect } from "vitest";

import type { CollectionWithMeta } from "@/lib/db/collections";
import type { ItemWithMeta } from "@/lib/db/items";
import {
  sortFavoriteCollections,
  sortFavoriteItems
} from "@/lib/favorites-sort";

function makeItem(overrides: {
  id: string;
  title: string;
  typeName: string;
  updatedAt: Date;
}): ItemWithMeta {
  const { id, title, typeName, updatedAt } = overrides;
  return {
    id,
    title,
    description: null,
    content: null,
    url: null,
    language: null,
    isFavorite: true,
    isPinned: false,
    lastUsedAt: null,
    updatedAt,
    createdAt: updatedAt,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    itemType: {
      id: `type-${typeName}`,
      name: typeName,
      icon: "Code",
      color: "#000000"
    },
    tags: []
  };
}

function makeCollection(overrides: {
  id: string;
  name: string;
  updatedAt: Date;
  dominantTypeName?: string | null;
}): CollectionWithMeta {
  const { dominantTypeName } = overrides;
  return {
    id: overrides.id,
    name: overrides.name,
    description: null,
    isFavorite: true,
    updatedAt: overrides.updatedAt,
    itemCount: 0,
    dominantType:
      dominantTypeName === undefined || dominantTypeName === null
        ? null
        : {
            id: `type-${dominantTypeName}`,
            name: dominantTypeName,
            icon: "Code",
            color: "#000000"
          },
    types: []
  };
}

describe("sortFavoriteItems", () => {
  const a = makeItem({
    id: "a",
    title: "Beta",
    typeName: "snippet",
    updatedAt: new Date("2026-05-10T12:00:00Z")
  });
  const b = makeItem({
    id: "b",
    title: "alpha",
    typeName: "note",
    updatedAt: new Date("2026-05-20T12:00:00Z")
  });
  const c = makeItem({
    id: "c",
    title: "Charlie",
    typeName: "snippet",
    updatedAt: new Date("2026-05-15T12:00:00Z")
  });

  it("sorts by newest (most-recently-updated first)", () => {
    const sorted = sortFavoriteItems([a, b, c], "newest");
    expect(sorted.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by oldest (least-recently-updated first)", () => {
    const sorted = sortFavoriteItems([a, b, c], "oldest");
    expect(sorted.map((i) => i.id)).toEqual(["a", "c", "b"]);
  });

  it("sorts by name ascending case-insensitively", () => {
    const sorted = sortFavoriteItems([a, b, c], "name-asc");
    expect(sorted.map((i) => i.id)).toEqual(["b", "a", "c"]);
  });

  it("sorts by name descending case-insensitively", () => {
    const sorted = sortFavoriteItems([a, b, c], "name-desc");
    expect(sorted.map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("groups by item type, then most-recently-updated within a group", () => {
    const sorted = sortFavoriteItems([a, b, c], "type");
    expect(sorted.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input array", () => {
    const input = [a, b, c];
    const snapshot = [...input];
    sortFavoriteItems(input, "name-asc");
    expect(input).toEqual(snapshot);
  });

  it("returns an empty array unchanged", () => {
    expect(sortFavoriteItems([], "newest")).toEqual([]);
  });
});

describe("sortFavoriteCollections", () => {
  const x = makeCollection({
    id: "x",
    name: "Zeta",
    updatedAt: new Date("2026-05-10T12:00:00Z"),
    dominantTypeName: "snippet"
  });
  const y = makeCollection({
    id: "y",
    name: "alpha",
    updatedAt: new Date("2026-05-20T12:00:00Z"),
    dominantTypeName: "note"
  });
  const z = makeCollection({
    id: "z",
    name: "Mike",
    updatedAt: new Date("2026-05-15T12:00:00Z"),
    dominantTypeName: null
  });

  it("sorts by newest (most-recently-updated first)", () => {
    const sorted = sortFavoriteCollections([x, y, z], "newest");
    expect(sorted.map((c) => c.id)).toEqual(["y", "z", "x"]);
  });

  it("sorts by oldest (least-recently-updated first)", () => {
    const sorted = sortFavoriteCollections([x, y, z], "oldest");
    expect(sorted.map((c) => c.id)).toEqual(["x", "z", "y"]);
  });

  it("sorts by name ascending case-insensitively", () => {
    const sorted = sortFavoriteCollections([x, y, z], "name-asc");
    expect(sorted.map((c) => c.id)).toEqual(["y", "z", "x"]);
  });

  it("sorts by name descending case-insensitively", () => {
    const sorted = sortFavoriteCollections([x, y, z], "name-desc");
    expect(sorted.map((c) => c.id)).toEqual(["x", "z", "y"]);
  });

  it("sorts by dominant type with null-typed collections at the end", () => {
    const sorted = sortFavoriteCollections([x, y, z], "type");
    expect(sorted.map((c) => c.id)).toEqual(["y", "x", "z"]);
  });

  it("falls back to date within the null-typed group", () => {
    const older = makeCollection({
      id: "older",
      name: "Older",
      updatedAt: new Date("2026-05-01T12:00:00Z"),
      dominantTypeName: null
    });
    const newer = makeCollection({
      id: "newer",
      name: "Newer",
      updatedAt: new Date("2026-05-25T12:00:00Z"),
      dominantTypeName: null
    });
    const sorted = sortFavoriteCollections([older, newer], "type");
    expect(sorted.map((c) => c.id)).toEqual(["newer", "older"]);
  });

  it("does not mutate the input array", () => {
    const input = [x, y, z];
    const snapshot = [...input];
    sortFavoriteCollections(input, "name-asc");
    expect(input).toEqual(snapshot);
  });
});
