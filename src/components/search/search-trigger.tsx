"use client";

import { Search } from "lucide-react";

import { useSearchPalette } from "@/components/search/search-palette-context";

export function SearchTrigger() {
  const { open } = useSearchPalette();
  return (
    <button
      type="button"
      onClick={open}
      className="relative flex h-10 w-full items-center rounded-md border border-input bg-background pl-10 pr-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:pr-16"
      aria-label="Open search (Ctrl+K)"
    >
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <span className="truncate">Search items and collections...</span>
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-block">
        ⌘K
      </kbd>
    </button>
  );
}
