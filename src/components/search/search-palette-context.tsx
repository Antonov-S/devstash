"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { CommandPalette } from "@/components/search/command-palette";
import type { SearchData } from "@/lib/db/search";

type SearchPaletteContextValue = {
  open: () => void;
};

const SearchPaletteContext = createContext<SearchPaletteContextValue | null>(
  null
);

export function SearchPaletteProvider({
  data,
  children
}: {
  data: SearchData;
  children: React.ReactNode;
}) {
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if (key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <SearchPaletteContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <CommandPalette data={data} open={isOpen} onOpenChange={setOpen} />
    </SearchPaletteContext.Provider>
  );
}

export function useSearchPalette(): SearchPaletteContextValue {
  const value = useContext(SearchPaletteContext);
  if (!value) {
    return { open: () => {} };
  }
  return value;
}
