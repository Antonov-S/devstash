import { Search } from "lucide-react";

import { NewCollectionDialog } from "@/components/collections/new-collection-dialog";
import { NewItemDialog } from "@/components/items/new-item-dialog";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 sm:gap-3 sm:px-4">
      <SidebarTrigger className="size-9 shrink-0" />

      <div className="flex min-w-0 flex-1 items-center justify-center">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search items..."
            className="h-10 pl-10 pr-12 text-sm sm:pr-16"
            disabled
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <NewCollectionDialog />
        <NewItemDialog />
      </div>
    </header>
  );
}
