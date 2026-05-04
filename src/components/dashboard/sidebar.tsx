import Link from "next/link";
import { ChevronDown, Settings } from "lucide-react";

import {
  SidebarCollections,
  type SidebarCollection
} from "@/components/dashboard/sidebar-collections";
import { Badge } from "@/components/ui/badge";
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
import {
  type CollectionWithMeta,
  getAllCollectionsForUser
} from "@/lib/db/collections";
import { getSystemItemTypesWithCountsForUser } from "@/lib/db/items";
import { getDemoUser } from "@/lib/db/users";
import { iconMap } from "@/lib/icons";

const groupClass = "px-3 py-2";
const groupLabelClass = "h-9 px-3 text-sm";
const menuClass = "gap-1";
const menuButtonClass = "h-10 gap-3 px-3 text-[15px]";

const IRREGULAR_PLURALS: Record<string, string | undefined> = {};

function pluralize(name: string) {
  return IRREGULAR_PLURALS[name] ?? `${name}s`;
}

function capitalize(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function initialsOf(name: string | null, email: string) {
  const source = name ?? email;
  return (
    source
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export async function DashboardSidebar() {
  const user = await getDemoUser();
  const [types, collections] = await Promise.all([
    getSystemItemTypesWithCountsForUser(user.id),
    getAllCollectionsForUser(user.id)
  ]);

  const toSidebar = (c: CollectionWithMeta): SidebarCollection => ({
    id: c.id,
    name: c.name,
    isFavorite: c.isFavorite,
    itemCount: c.itemCount,
    dominantColor: c.dominantType?.color ?? null
  });
  const favoriteCollections = collections.filter((c) => c.isFavorite).map(toSidebar);
  const recentCollections = collections.filter((c) => !c.isFavorite).map(toSidebar);
  const initials = initialsOf(user.name, user.email);
  const displayName = user.name ?? user.email;

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
              {types.map((type) => {
                const Icon = iconMap[type.icon];
                const label = capitalize(pluralize(type.name));
                const isPro = type.name === "file" || type.name === "image";
                return (
                  <SidebarMenuItem key={type.id}>
                    <SidebarMenuButton
                      className={menuButtonClass}
                      render={<Link href={`/items/${pluralize(type.name)}`} />}
                      tooltip={label}
                    >
                      {Icon && (
                        <Icon
                          className="size-4 shrink-0"
                          style={{ color: type.color }}
                        />
                      )}
                      <span className="truncate">{label}</span>
                      <span className="flex flex-1 justify-center group-data-[collapsible=icon]:hidden">
                        {isPro && (
                          <Badge
                            variant="outline"
                            className="h-4 px-1.5 text-[10px] font-semibold tracking-wide text-sidebar-foreground/60"
                          >
                            PRO
                          </Badge>
                        )}
                      </span>
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

        <SidebarCollections
          favorites={favoriteCollections}
          recents={recentCollections}
        />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={displayName}
              className="data-[slot=sidebar-menu-button]:h-12"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground">
                {initials}
              </span>
              <div className="flex min-w-0 flex-1 flex-col text-left group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">{displayName}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  {user.email}
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
