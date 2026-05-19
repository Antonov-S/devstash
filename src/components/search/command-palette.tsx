"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";

import { ItemDrawer } from "@/components/items/item-drawer";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import type { ItemWithMeta } from "@/lib/db/items";
import type { SearchData, SearchItem } from "@/lib/db/search";
import { fuzzySearch } from "@/lib/fuzzy-search";
import { iconMap } from "@/lib/icons";

const ITEM_RESULTS_LIMIT = 8;
const COLLECTION_RESULTS_LIMIT = 6;

type Props = {
  data: SearchData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ data, open, onOpenChange }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [drawerItem, setDrawerItem] = useState<ItemWithMeta | null>(null);

  const itemResults = fuzzySearch(
    query,
    data.items,
    (item) => [item.title, item.itemType.name, item.preview],
    ITEM_RESULTS_LIMIT
  ).map((match) => match.item);

  const collectionResults = fuzzySearch(
    query,
    data.collections,
    (collection) => [collection.name],
    COLLECTION_RESULTS_LIMIT
  ).map((match) => match.item);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) setQuery("");
  }

  function handleSelectItem(item: SearchItem) {
    handleOpenChange(false);
    setDrawerItem(searchItemToCardItem(item));
  }

  function handleSelectCollection(id: string) {
    handleOpenChange(false);
    router.push(`/collections/${id}`);
  }

  const noResults =
    query.trim().length > 0 &&
    itemResults.length === 0 &&
    collectionResults.length === 0;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="max-w-xl gap-0 overflow-hidden p-0"
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search items and collections
          </DialogDescription>
          <Command shouldFilter={false} loop>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search items and collections..."
              autoFocus
            />
            <CommandList>
              {noResults ? (
                <CommandEmpty>No results found.</CommandEmpty>
              ) : null}

              {itemResults.length > 0 && (
                <CommandGroup heading="Items">
                  {itemResults.map((item) => {
                    const Icon = iconMap[item.itemType.icon];
                    return (
                      <CommandItem
                        key={item.id}
                        value={`item-${item.id}-${item.title}`}
                        onSelect={() => handleSelectItem(item)}
                      >
                        {Icon && (
                          <span
                            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/40"
                            aria-hidden
                          >
                            <Icon
                              className="size-3.5"
                              style={{ color: item.itemType.color }}
                            />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.title}
                          </p>
                          {item.preview && (
                            <p className="truncate text-xs text-muted-foreground">
                              {item.preview}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-[11px] capitalize text-muted-foreground">
                          {item.itemType.name}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {collectionResults.length > 0 && (
                <CommandGroup heading="Collections">
                  {collectionResults.map((collection) => (
                    <CommandItem
                      key={collection.id}
                      value={`collection-${collection.id}-${collection.name}`}
                      onSelect={() => handleSelectCollection(collection.id)}
                    >
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/40"
                        aria-hidden
                      >
                        <FolderOpen className="size-3.5 text-muted-foreground" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {collection.name}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {collection.itemCount}{" "}
                        {collection.itemCount === 1 ? "item" : "items"}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {drawerItem && (
        <ItemDrawer
          cardItem={drawerItem}
          open={drawerItem !== null}
          onOpenChange={(next) => {
            if (!next) setDrawerItem(null);
          }}
        />
      )}
    </>
  );
}

function searchItemToCardItem(item: SearchItem): ItemWithMeta {
  const now = new Date();
  return {
    id: item.id,
    title: item.title,
    description: null,
    content: null,
    url: null,
    language: null,
    isFavorite: false,
    isPinned: false,
    lastUsedAt: null,
    updatedAt: now,
    createdAt: now,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    itemType: item.itemType,
    tags: []
  };
}
