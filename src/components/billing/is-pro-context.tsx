"use client";

import { createContext, useContext } from "react";

const IsProContext = createContext<boolean>(false);

export function IsProProvider({
  isPro,
  children
}: {
  isPro: boolean;
  children: React.ReactNode;
}) {
  return <IsProContext.Provider value={isPro}>{children}</IsProContext.Provider>;
}

export function useIsPro(): boolean {
  return useContext(IsProContext);
}
