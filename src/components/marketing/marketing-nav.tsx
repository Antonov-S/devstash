"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { DevStashLogoMark } from "@/components/marketing/logo-mark";
import { cn } from "@/lib/utils";

type Props = {
  isAuthenticated: boolean;
};

export function MarketingNav({ isAuthenticated }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      data-scrolled={scrolled}
      className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-background/60 backdrop-blur transition-[background-color,border-color] duration-200 data-[scrolled=true]:border-border data-[scrolled=true]:bg-background/90"
    >
      <div className="mx-auto flex max-w-300 items-center gap-7 px-6 py-3.5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[16px] font-semibold tracking-tight"
        >
          <DevStashLogoMark />
          <span>DevStash</span>
        </Link>
        <ul className="ml-2 hidden gap-5 md:flex">
          <li>
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
          </li>
          <li>
            <a
              href="#ai"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              AI
            </a>
          </li>
          <li>
            <a
              href="#pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </a>
          </li>
        </ul>
        <div className="ml-auto inline-flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "default", size: "lg" }))}
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "hidden md:inline-flex"
                )}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ variant: "default", size: "lg" }))}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
