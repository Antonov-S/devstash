import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { auth } from "@/auth";
import {
  SidebarCollections,
  type SidebarCollection
} from "@/components/dashboard/sidebar-collections";
import { SidebarUserMenu } from "@/components/dashboard/sidebar-user-menu";
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
import { DevStashLogoMark } from "@/components/marketing/logo-mark";
import {
  type CollectionWithMeta,
  getAllCollectionsForUser
} from "@/lib/db/collections";
import { getSystemItemTypesWithCountsForUser } from "@/lib/db/items";
import { iconMap } from "@/lib/icons";
import { capitalize } from "@/lib/utils";

const groupClass = "px-3 py-2";
const groupLabelClass = "h-9 px-3 text-sm";
const menuClass = "gap-1";
const menuButtonClass = "h-10 gap-3 px-3 text-[15px]";

const IRREGULAR_PLURALS: Record<string, string | undefined> = {};

function pluralize(name: string) {
  return IRREGULAR_PLURALS[name] ?? `${name}s`;
}

export async function DashboardSidebar() {
  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser?.id || !sessionUser.email) return null;

  const [types, collections] = await Promise.all([
    getSystemItemTypesWithCountsForUser(sessionUser.id),
    getAllCollectionsForUser(sessionUser.id)
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight"
          aria-label="DevStash"
        >
          <DevStashLogoMark />
          <span className="group-data-[collapsible=icon]:hidden">DevStash</span>
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
                const isProType =
                  type.name === "file" || type.name === "image";
                const showProBadge = isProType && !sessionUser.isPro;
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
                        {showProBadge && (
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
        <SidebarUserMenu
          name={sessionUser.name ?? null}
          email={sessionUser.email}
          image={sessionUser.image ?? null}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
