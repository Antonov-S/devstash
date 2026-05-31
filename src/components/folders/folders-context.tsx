"use client";

import { createContext, useContext } from "react";

import type { FolderListEntry } from "@/lib/db/folders";

const UserFoldersContext = createContext<FolderListEntry[]>([]);

export function UserFoldersProvider({
  folders,
  children
}: {
  folders: FolderListEntry[];
  children: React.ReactNode;
}) {
  return (
    <UserFoldersContext.Provider value={folders}>
      {children}
    </UserFoldersContext.Provider>
  );
}

export function useUserFolders(): FolderListEntry[] {
  return useContext(UserFoldersContext);
}
