import { Star } from "lucide-react";
import Link from "next/link";

import { NewCollectionDialog } from "@/components/collections/new-collection-dialog";
import { NewItemDialog } from "@/components/items/new-item-dialog";
import { DevStashLogoMark } from "@/components/marketing/logo-mark";
import { SearchTrigger } from "@/components/search/search-trigger";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 sm:gap-3 sm:px-4">
      <SidebarTrigger className="size-9 shrink-0" />

      <Link
        href="/dashboard"
        className="inline-flex shrink-0 items-center gap-2 text-[15px] font-semibold tracking-tight"
      >
        <DevStashLogoMark />
        <span className="hidden sm:inline">DevStash</span>
      </Link>

      <div className="flex min-w-0 flex-1 items-center justify-center">
        <div className="w-full max-w-md">
          <SearchTrigger />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/favorites"
          aria-label="Favorites"
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star className="size-4" />
        </Link>
        <NewCollectionDialog />
        <NewItemDialog />
      </div>
    </header>
  );
}
