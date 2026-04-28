import Link from "next/link";
import { ChevronDown, Folder, Settings, Star } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator
} from "@/components/ui/sidebar";
import { iconMap } from "@/lib/icons";
import { mockCollections, mockItemTypes, mockUser } from "@/lib/mock-data";

const groupClass = "px-3 py-2";
const groupLabelClass = "h-9 px-3 text-sm";
const menuClass = "gap-1";
const menuButtonClass = "h-10 gap-3 px-3 text-[15px]";

export function DashboardSidebar() {
  const favoriteCollections = mockCollections.filter(c => c.isFavorite);
  const recentCollections = mockCollections
    .filter(c => !c.isFavorite)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  const initials =
    mockUser.name
      ?.split(" ")
      .map(part => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
            DS
          </span>
          <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
            DevStash
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-1">
        <SidebarGroup className={groupClass}>
          <SidebarGroupLabel
            className={`${groupLabelClass} gap-2 font-normal uppercase tracking-wider text-sidebar-foreground/70`}
          >
            <ChevronDown
              className="size-4 shrink-0 text-sidebar-foreground/60"
              aria-hidden
            />
            <span>Types</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={menuClass}>
              {mockItemTypes.map(type => {
                const Icon = iconMap[type.icon];
                return (
                  <SidebarMenuItem key={type.id}>
                    <SidebarMenuButton
                      className={menuButtonClass}
                      render={<Link href={`/items/${type.slug}`} />}
                      tooltip={type.label}
                    >
                      {Icon && (
                        <Icon
                          className="size-4 shrink-0"
                          style={{ color: type.color }}
                        />
                      )}
                      <span className="flex-1 truncate">{type.label}</span>
                      <span className="text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                        {type.itemCount}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-1 group-data-[collapsible=icon]:hidden" />

        <SidebarGroup className={groupClass}>
          <SidebarGroupLabel
            className={`${groupLabelClass} gap-2 font-normal uppercase tracking-wider text-sidebar-foreground/70`}
          >
            <ChevronDown
              className="size-4 shrink-0 text-sidebar-foreground/60"
              aria-hidden
            />
            <span>Collections</span>
          </SidebarGroupLabel>
        </SidebarGroup>

        {favoriteCollections.length > 0 && (
          <SidebarGroup className={`${groupClass} pt-0`}>
            <SidebarGroupLabel className="px-3 text-xs font-medium tracking-wider text-sidebar-foreground/50">
              Favorites
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className={menuClass}>
                {favoriteCollections.map(collection => (
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

        {recentCollections.length > 0 && (
          <SidebarGroup className={`${groupClass} pt-0`}>
            <SidebarGroupLabel className="px-3 text-xs font-medium tracking-wider text-sidebar-foreground/50">
              Recent
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className={menuClass}>
                {recentCollections.map(collection => (
                  <SidebarMenuItem key={collection.id}>
                    <SidebarMenuButton
                      className={menuButtonClass}
                      render={<Link href={`/collections/${collection.id}`} />}
                      tooltip={collection.name}
                    >
                      <Folder className="size-4 shrink-0" />
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={mockUser.name ?? "Account"}
              className="data-[slot=sidebar-menu-button]:h-12"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground">
                {initials}
              </span>
              <div className="flex min-w-0 flex-1 flex-col text-left group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">
                  {mockUser.name}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  {mockUser.email}
                </span>
              </div>
              <Settings className="size-4 shrink-0 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
