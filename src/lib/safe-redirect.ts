export const DEFAULT_REDIRECT = "/dashboard";

export function safeRedirectPath(
  value: unknown,
  fallback: string = DEFAULT_REDIRECT
): string {
  if (typeof value !== "string" || value.length === 0) return fallback;
  // Must be a same-origin absolute path. Reject protocol-relative URLs
  // (`//evil.com`, `/\evil.com`) and anything that isn't rooted at `/`.
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
