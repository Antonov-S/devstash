import { auth } from "@/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { UserCollectionsProvider } from "@/components/items/collections-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getUserCollectionsList,
  type CollectionListEntry
} from "@/lib/db/collections";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  let collections: CollectionListEntry[] = [];
  if (session?.user?.id) {
    collections = await getUserCollectionsList(session.user.id);
  }

  return (
    <UserCollectionsProvider collections={collections}>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset className="flex h-screen flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </UserCollectionsProvider>
  );
}
