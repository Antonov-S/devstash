import { auth } from "@/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { EditorPreferencesProvider } from "@/components/editor/editor-preferences-context";
import { UserCollectionsProvider } from "@/components/items/collections-context";
import { SearchPaletteProvider } from "@/components/search/search-palette-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  getUserCollectionsList,
  type CollectionListEntry
} from "@/lib/db/collections";
import { getUserSearchData, type SearchData } from "@/lib/db/search";
import { getUserEditorPreferences } from "@/lib/db/users";
import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences
} from "@/lib/editor-preferences";

const EMPTY_SEARCH_DATA: SearchData = { items: [], collections: [] };

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  let collections: CollectionListEntry[] = [];
  let searchData: SearchData = EMPTY_SEARCH_DATA;
  let editorPreferences: EditorPreferences = DEFAULT_EDITOR_PREFERENCES;
  if (session?.user?.id) {
    [collections, searchData, editorPreferences] = await Promise.all([
      getUserCollectionsList(session.user.id),
      getUserSearchData(session.user.id),
      getUserEditorPreferences(session.user.id)
    ]);
  }

  return (
    <EditorPreferencesProvider initial={editorPreferences}>
      <UserCollectionsProvider collections={collections}>
        <SearchPaletteProvider data={searchData}>
          <SidebarProvider>
            <DashboardSidebar />
            <SidebarInset className="flex h-screen flex-col">
              <TopBar />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </SearchPaletteProvider>
      </UserCollectionsProvider>
    </EditorPreferencesProvider>
  );
}
