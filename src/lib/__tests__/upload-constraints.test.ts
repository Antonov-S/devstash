import { describe, expect, it } from "vitest";

import {
  MAX_FILE_SIZE_BYTES,
  MAX_IMAGE_SIZE_BYTES,
  formatBytes,
  getExtension,
  validateUpload
} from "@/lib/upload-constraints";

describe("getExtension", () => {
  it("returns the lowercase extension including the dot", () => {
    expect(getExtension("photo.PNG")).toBe(".png");
    expect(getExtension("script.test.ts")).toBe(".ts");
  });

  it("returns an empty string when there is no extension", () => {
    expect(getExtension("README")).toBe("");
  });
});

describe("formatBytes", () => {
  it("formats bytes, KB, and MB ranges", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
});

describe("validateUpload", () => {
  it("accepts a valid PNG image under the size limit", () => {
    const result = validateUpload("image", {
      name: "logo.png",
      size: 1024,
      type: "image/png"
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects images over 5 MB", () => {
    const result = validateUpload("image", {
      name: "huge.png",
      size: MAX_IMAGE_SIZE_BYTES + 1,
      type: "image/png"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Image/);
    }
  });

  it("rejects files over 10 MB", () => {
    const result = validateUpload("file", {
      name: "doc.pdf",
      size: MAX_FILE_SIZE_BYTES + 1,
      type: "application/pdf"
    });
    expect(result.ok).toBe(false);
  });

  it("rejects unsupported extensions", () => {
    const result = validateUpload("file", {
      name: "shady.exe",
      size: 1024,
      type: "application/octet-stream"
    });
    expect(result.ok).toBe(false);
  });

  it("rejects images uploaded under the file kind", () => {
    const result = validateUpload("file", {
      name: "logo.png",
      size: 1024,
      type: "image/png"
    });
    expect(result.ok).toBe(false);
  });

  it("accepts .ini files even when browsers report text/plain", () => {
    const result = validateUpload("file", {
      name: "config.ini",
      size: 256,
      type: "text/plain"
    });
    expect(result).toEqual({ ok: true });
  });

  it("accepts SVG images with image/svg+xml MIME type", () => {
    const result = validateUpload("image", {
      name: "icon.svg",
      size: 256,
      type: "image/svg+xml"
    });
    expect(result).toEqual({ ok: true });
  });

  it("tolerates an empty MIME type when the extension matches", () => {
    const result = validateUpload("file", {
      name: "notes.md",
      size: 256,
      type: ""
    });
    expect(result).toEqual({ ok: true });
  });

  it("tolerates application/octet-stream when the extension matches", () => {
    // Some browsers report octet-stream for less common types; the validator
    // deliberately falls back to the extension allowlist in that case.
    const result = validateUpload("file", {
      name: "config.toml",
      size: 256,
      type: "application/octet-stream"
    });
    expect(result).toEqual({ ok: true });
  });
});
