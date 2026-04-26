import { FolderHeart, Folders, Package, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { mockCollections, mockItems } from "@/lib/mock-data";

const stats = [
  {
    label: "Total Items",
    value: mockItems.length,
    icon: Package,
    color: "text-blue-400"
  },
  {
    label: "Collections",
    value: mockCollections.length,
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
    value: mockCollections.filter((c) => c.isFavorite).length,
    icon: FolderHeart,
    color: "text-pink-400"
  }
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-5 py-3">
              <Icon className={`size-12 shrink-0 ${stat.color}`} />
              <div>
                <p className="text-4xl font-semibold leading-none">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
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
