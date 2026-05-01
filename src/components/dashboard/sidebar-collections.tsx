"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Folder, Star } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";

const groupClass = "px-3 py-2";
const groupLabelClass = "h-9 px-3 text-sm";
const menuClass = "gap-1";
const menuButtonClass = "h-10 gap-3 px-3 text-[15px]";

export type SidebarCollection = {
  id: string;
  name: string;
  isFavorite: boolean;
  itemCount: number;
  dominantColor: string | null;
};

type SidebarCollectionsProps = {
  favorites: SidebarCollection[];
  recents: SidebarCollection[];
};

export function SidebarCollections({
  favorites,
  recents
}: SidebarCollectionsProps) {
  const [expanded, setExpanded] = useState(true);
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <>
      <SidebarGroup className={groupClass}>
        <SidebarGroupLabel
          render={
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-controls="sidebar-collections-content"
            />
          }
          className={`${groupLabelClass} gap-2 font-normal uppercase tracking-wider text-sidebar-foreground/70 hover:text-sidebar-foreground`}
        >
          <Chevron
            className="size-4 shrink-0 text-sidebar-foreground/60"
            aria-hidden
          />
          <span>Collections</span>
        </SidebarGroupLabel>
      </SidebarGroup>

      {expanded && (
        <div id="sidebar-collections-content">
          {favorites.length > 0 && (
            <SidebarGroup className={`${groupClass} pt-0`}>
              <SidebarGroupLabel className="px-3 text-xs font-medium tracking-wider text-sidebar-foreground/50">
                Favorites
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className={menuClass}>
                  {favorites.map((collection) => (
                    <SidebarMenuItem key={collection.id}>
                      <SidebarMenuButton
                        className={menuButtonClass}
                        render={<Link href={`/collections/${collection.id}`} />}
                        tooltip={collection.name}
                      >
                        <Folder className="size-4 shrink-0" />
                        <span className="flex-1 truncate">{collection.name}</span>
                        <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400 group-data-[collapsible=icon]:hidden" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {recents.length > 0 && (
            <SidebarGroup className={`${groupClass} pt-0`}>
              <SidebarGroupLabel className="px-3 text-xs font-medium tracking-wider text-sidebar-foreground/50">
                Recent
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className={menuClass}>
                  {recents.map((collection) => (
                    <SidebarMenuItem key={collection.id}>
                      <SidebarMenuButton
                        className={menuButtonClass}
                        render={<Link href={`/collections/${collection.id}`} />}
                        tooltip={collection.name}
                      >
                        <span
                          className="size-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              collection.dominantColor ?? "var(--muted)"
                          }}
                          aria-hidden
                        />
                        <span className="flex-1 truncate">{collection.name}</span>
                        <span className="text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                          {collection.itemCount}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup className={`${groupClass} pt-0`}>
            <SidebarGroupContent>
              <SidebarMenu className={menuClass}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className={`${menuButtonClass} text-sidebar-foreground/70`}
                    render={<Link href="/collections" />}
                    tooltip="View all collections"
                  >
                    <ChevronRight className="size-4 shrink-0" />
                    <span className="flex-1 truncate">View all collections</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      )}
    </>
  );
}
