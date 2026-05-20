import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buildPageHref, buildPageList } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  baseHref: string;
  className?: string;
};

const BUTTON_BASE =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-background px-2 text-sm font-medium transition-colors hover:bg-muted";
const BUTTON_DISABLED =
  "pointer-events-none cursor-not-allowed opacity-50 hover:bg-background";
const BUTTON_ACTIVE =
  "border-primary bg-primary text-primary-foreground hover:bg-primary";

export function Pagination({
  currentPage,
  totalPages,
  baseHref,
  className
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      {hasPrev ? (
        <Link
          href={buildPageHref(baseHref, currentPage - 1)}
          aria-label="Previous page"
          className={BUTTON_BASE}
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span
          aria-label="Previous page"
          aria-disabled
          className={cn(BUTTON_BASE, BUTTON_DISABLED)}
        >
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pages.map((item, idx) => {
        if (item === "ellipsis-start" || item === "ellipsis-end") {
          return (
            <span
              key={`${item}-${idx}`}
              aria-hidden
              className="inline-flex h-8 min-w-8 items-center justify-center text-sm text-muted-foreground"
            >
              …
            </span>
          );
        }
        const isActive = item === currentPage;
        return (
          <Link
            key={item}
            href={buildPageHref(baseHref, item)}
            aria-label={`Page ${item}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(BUTTON_BASE, isActive && BUTTON_ACTIVE)}
          >
            {item}
          </Link>
        );
      })}

      {hasNext ? (
        <Link
          href={buildPageHref(baseHref, currentPage + 1)}
          aria-label="Next page"
          className={BUTTON_BASE}
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span
          aria-label="Next page"
          aria-disabled
          className={cn(BUTTON_BASE, BUTTON_DISABLED)}
        >
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
