import { Sparkles, Star } from "lucide-react";
import Link from "next/link";

import { TopBarCreateMenu } from "@/components/dashboard/top-bar-create-menu";
import {
  SearchTrigger,
  SearchTriggerIcon
} from "@/components/search/search-trigger";
import { buttonVariants } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type Props = {
  isPro: boolean;
};

export function TopBar({ isPro }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 sm:gap-3 sm:px-4">
      <SidebarTrigger className="size-9 shrink-0" />

      <div className="hidden min-w-0 flex-1 items-center justify-center sm:flex">
        <div className="w-full max-w-md">
          <SearchTrigger />
        </div>
      </div>

      <div className="flex-1 sm:hidden" aria-hidden />

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <SearchTriggerIcon className="sm:hidden" />
        {!isPro ? (
          <Link
            href="/upgrade"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-9 gap-1.5 px-3 text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles aria-hidden className="size-4" />
            <span className="hidden sm:inline">Upgrade</span>
          </Link>
        ) : null}
        <Link
          href="/favorites"
          aria-label="Favorites"
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star className="size-4" />
        </Link>
        <TopBarCreateMenu />
      </div>
    </header>
  );
}
