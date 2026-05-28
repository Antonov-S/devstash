"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SidebarMenuButton } from "@/components/ui/sidebar";

type SidebarNavButtonProps = {
  href: string;
  tooltip?: string;
  className?: string;
  children: ReactNode;
};

export function SidebarNavButton({
  href,
  tooltip,
  className,
  children
}: SidebarNavButtonProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <SidebarMenuButton
      className={className}
      render={<Link href={href} />}
      tooltip={tooltip}
      isActive={isActive}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </SidebarMenuButton>
  );
}
