"use client";

import { useState } from "react";
import { FolderPlus, Plus } from "lucide-react";

import { NewCollectionDialog } from "@/components/collections/new-collection-dialog";
import { NewItemDialog } from "@/components/items/new-item-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function TopBarCreateMenu() {
  const [itemOpen, setItemOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="sm" aria-label="Create new" title="Create new">
              <Plus className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" sideOffset={6} className="w-44">
          <DropdownMenuItem onClick={() => setItemOpen(true)}>
            <Plus />
            <span>New item</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCollectionOpen(true)}>
            <FolderPlus />
            <span>New collection</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NewItemDialog open={itemOpen} onOpenChange={setItemOpen} />
      <NewCollectionDialog
        open={collectionOpen}
        onOpenChange={setCollectionOpen}
      />
    </>
  );
}
