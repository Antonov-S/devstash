"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ChevronsUpDown, LogOut, Settings, UserRound } from "lucide-react";

import { signOutAction } from "@/actions/auth";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem
} from "@/components/ui/sidebar";

type SidebarUserMenuProps = {
  name: string | null;
  email: string;
  image: string | null;
};

export function SidebarUserMenu({ name, email, image }: SidebarUserMenuProps) {
  const displayName = name ?? email;
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(() => {
      signOutAction();
    });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            data-slot="sidebar-menu-button"
            className="group/sidebar-user peer/menu-button flex h-12 w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-hidden transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center"
          >
            <UserAvatar
              name={name}
              email={email}
              image={image}
              className="size-8 shrink-0"
            />
            <div className="flex min-w-0 flex-1 flex-col text-left group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-medium">
                {displayName}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/60">
                {email}
              </span>
            </div>
            <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="end"
            sideOffset={8}
            className="w-56"
          >
            <div className="flex items-center gap-2 p-2">
              <UserAvatar name={name} email={email} image={image} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col text-left">
                <span className="truncate text-sm font-medium text-foreground">
                  {displayName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/profile" />}>
              <UserRound />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={isPending}
              onClick={handleSignOut}
            >
              <LogOut />
              <span>{isPending ? "Signing out…" : "Sign out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
