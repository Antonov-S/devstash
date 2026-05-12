import { describe, it, expect } from "vitest";

import {
  SYSTEM_TYPE_NAMES,
  slugFromSystemTypeName,
  systemTypeNameFromSlug
} from "@/lib/system-types";

describe("system-types", () => {
  describe("systemTypeNameFromSlug", () => {
    it("returns the singular name for each known plural slug", () => {
      expect(systemTypeNameFromSlug("snippets")).toBe("snippet");
      expect(systemTypeNameFromSlug("prompts")).toBe("prompt");
      expect(systemTypeNameFromSlug("commands")).toBe("command");
      expect(systemTypeNameFromSlug("notes")).toBe("note");
      expect(systemTypeNameFromSlug("files")).toBe("file");
      expect(systemTypeNameFromSlug("images")).toBe("image");
      expect(systemTypeNameFromSlug("links")).toBe("link");
    });

    it("returns null for an unknown slug", () => {
      expect(systemTypeNameFromSlug("widgets")).toBeNull();
      expect(systemTypeNameFromSlug("")).toBeNull();
      expect(systemTypeNameFromSlug("snippet")).toBeNull();
    });
  });

  describe("slugFromSystemTypeName", () => {
    it("returns the plural slug for each system type name", () => {
      for (const name of SYSTEM_TYPE_NAMES) {
        const slug = slugFromSystemTypeName(name);
        expect(slug).toBeTruthy();
        expect(systemTypeNameFromSlug(slug)).toBe(name);
      }
    });
  });
});
