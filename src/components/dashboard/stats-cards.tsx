import { FolderHeart, Folders, Package, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { mockItems } from "@/lib/mock-data";

type StatsCardsProps = {
  collectionCount: number;
  favoriteCollectionCount: number;
};

export function StatsCards({
  collectionCount,
  favoriteCollectionCount
}: StatsCardsProps) {
  const stats = [
    {
      label: "Total Items",
      value: mockItems.length,
      icon: Package,
      color: "text-blue-400"
    },
    {
      label: "Collections",
      value: collectionCount,
      icon: Folders,
      color: "text-emerald-400"
    },
    {
      label: "Favorite Items",
      value: mockItems.filter((i) => i.isFavorite).length,
      icon: Star,
      color: "text-yellow-400"
    },
    {
      label: "Favorite Collections",
      value: favoriteCollectionCount,
      icon: FolderHeart,
      color: "text-pink-400"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 py-3 sm:gap-5">
              <Icon className={`size-9 shrink-0 sm:size-12 ${stat.color}`} />
              <div className="min-w-0">
                <p className="text-2xl font-semibold leading-none sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1.5 truncate text-xs text-muted-foreground sm:mt-2 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
