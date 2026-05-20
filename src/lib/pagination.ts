export {
  ITEMS_PER_PAGE,
  COLLECTIONS_PER_PAGE,
  DASHBOARD_COLLECTIONS_LIMIT,
  DASHBOARD_RECENT_ITEMS_LIMIT
} from "@/lib/constants";

export type PageParamInput = string | string[] | undefined;

export function parsePageParam(value: PageParamInput): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export type PaginationResult = {
  currentPage: number;
  totalPages: number;
  skip: number;
  take: number;
};

export function paginate({
  page,
  perPage,
  totalCount
}: {
  page: number;
  perPage: number;
  totalCount: number;
}): PaginationResult {
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const skip = (currentPage - 1) * perPage;
  return { currentPage, totalPages, skip, take: perPage };
}

export type PageItem = number | "ellipsis-start" | "ellipsis-end";

export function buildPageList(
  currentPage: number,
  totalPages: number
): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: PageItem[] = [1];

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push("ellipsis-start");

  for (let p = start; p <= end; p++) items.push(p);

  if (end < totalPages - 1) items.push("ellipsis-end");

  items.push(totalPages);
  return items;
}

export function buildPageHref(baseHref: string, page: number): string {
  if (page <= 1) return baseHref;
  const sep = baseHref.includes("?") ? "&" : "?";
  return `${baseHref}${sep}page=${page}`;
}
