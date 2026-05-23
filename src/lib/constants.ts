import type { SystemTypeName } from "@/lib/system-types";

export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;
export const DASHBOARD_COLLECTIONS_LIMIT = 6;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;
export const FAVORITES_ITEMS_LIMIT = 200;
export const FAVORITES_COLLECTIONS_LIMIT = 200;

export const FREE_TIER_LIMITS = {
  items: 50,
  collections: 3
} as const;

export const PRO_ONLY_ITEM_TYPES = new Set<string>(["file", "image"]);

export const PRO_FEATURES = [
  "Unlimited items and collections",
  "File & image uploads",
  "AI auto-tagging, summaries, and code explain",
  "Export as JSON or ZIP"
] as const;

export const SYSTEM_TYPE_COLORS: Record<SystemTypeName, string> = {
  snippet: "#3b82f6",
  prompt: "#8b5cf6",
  command: "#f97316",
  note: "#fde047",
  file: "#6b7280",
  image: "#ec4899",
  link: "#10b981"
};
