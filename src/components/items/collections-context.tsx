"use client";

import { createContext, useContext } from "react";

import type { CollectionListEntry } from "@/lib/db/collections";

const UserCollectionsContext = createContext<CollectionListEntry[]>([]);

export function UserCollectionsProvider({
  collections,
  children
}: {
  collections: CollectionListEntry[];
  children: React.ReactNode;
}) {
  return (
    <UserCollectionsContext.Provider value={collections}>
      {children}
    </UserCollectionsContext.Provider>
  );
}

export function useUserCollections(): CollectionListEntry[] {
  return useContext(UserCollectionsContext);
}
