import { LoaderCircle } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

export function ItemDrawerSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy aria-live="polite">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
        Loading…
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-10" />
        </div>
      </div>
    </div>
  );
}
