import { NewCollectionDialog } from "@/components/collections/new-collection-dialog";
import { NewItemDialog } from "@/components/items/new-item-dialog";
import { SearchTrigger } from "@/components/search/search-trigger";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 sm:gap-3 sm:px-4">
      <SidebarTrigger className="size-9 shrink-0" />

      <div className="flex min-w-0 flex-1 items-center justify-center">
        <div className="w-full max-w-md">
          <SearchTrigger />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <NewCollectionDialog />
        <NewItemDialog />
      </div>
    </header>
  );
}
