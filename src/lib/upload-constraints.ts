export type UploadKind = "file" | "image";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg"
] as const;

export const FILE_EXTENSIONS = [
  ".pdf",
  ".txt",
  ".md",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".csv",
  ".toml",
  ".ini"
] as const;

export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml"
] as const;

export const FILE_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/x-yaml",
  "text/yaml",
  "application/xml",
  "text/xml",
  "text/csv",
  "application/toml"
] as const;

type Constraint = {
  maxSize: number;
  extensions: readonly string[];
  mimeTypes: readonly string[];
  label: string;
  accept: string;
};

export const UPLOAD_CONSTRAINTS: Record<UploadKind, Constraint> = {
  image: {
    maxSize: MAX_IMAGE_SIZE_BYTES,
    extensions: IMAGE_EXTENSIONS,
    mimeTypes: IMAGE_MIME_TYPES,
    label: "Image",
    accept: IMAGE_EXTENSIONS.join(",")
  },
  file: {
    maxSize: MAX_FILE_SIZE_BYTES,
    extensions: FILE_EXTENSIONS,
    mimeTypes: FILE_MIME_TYPES,
    label: "File",
    accept: FILE_EXTENSIONS.join(",")
  }
};

export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateUpload(
  kind: UploadKind,
  file: { name: string; size: number; type: string }
): ValidationResult {
  const constraint = UPLOAD_CONSTRAINTS[kind];

  if (file.size > constraint.maxSize) {
    return {
      ok: false,
      error: `${constraint.label} exceeds ${formatBytes(constraint.maxSize)} limit.`
    };
  }

  const extension = getExtension(file.name);
  const extensionAllowed = (constraint.extensions as readonly string[]).includes(
    extension
  );

  // `.ini` is allowed; browsers usually report it with no MIME type or as text/plain.
  const mimeAllowed =
    file.type === "" ||
    file.type === "application/octet-stream" ||
    (constraint.mimeTypes as readonly string[]).includes(file.type) ||
    (extension === ".ini" && file.type === "text/plain");

  if (!extensionAllowed || !mimeAllowed) {
    return {
      ok: false,
      error: `${constraint.label} type is not supported.`
    };
  }

  return { ok: true };
}
