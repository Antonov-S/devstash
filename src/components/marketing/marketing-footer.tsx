import Link from "next/link";

import { DevStashLogoMark } from "@/components/marketing/logo-mark";
import { GITHUB_REPO_URL } from "@/lib/constants";

type FooterLink =
  | { label: string; href: string; kind: "anchor" } // absolute /#hash to a homepage section
  | { label: string; href: string; kind: "internal" } // next/link to a real route
  | { label: string; href: string; kind: "external" } // new tab, rel="noopener noreferrer"
  | { label: string; kind: "placeholder" }; // disabled (no destination yet)

type FooterColumn = {
  heading: string;
  links: FooterLink[];
};

// Anchors use the absolute `/#…` form (not bare `#…`) so they resolve against
// the homepage from any route the footer renders on (e.g. /privacy, /terms).
const COLUMNS: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/#features", kind: "anchor" },
      { label: "Pricing", href: "/#pricing", kind: "anchor" },
      { label: "AI", href: "/#ai", kind: "anchor" },
      { label: "Changelog", href: "/changelog", kind: "internal" }
    ]
  },
  {
    heading: "Resources",
    links: [
      { label: "Docs", href: `${GITHUB_REPO_URL}#readme`, kind: "external" },
      { label: "Support", kind: "placeholder" }
    ]
  },
  {
    heading: "Company",
    links: [
      { label: "Privacy", href: "/privacy", kind: "internal" },
      { label: "Terms", href: "/terms", kind: "internal" },
      { label: "Contact", kind: "placeholder" }
    ]
  }
];

const LINK_CLASS =
  "text-sm text-muted-foreground transition-colors hover:text-foreground";
const PLACEHOLDER_CLASS =
  "cursor-not-allowed text-sm text-muted-foreground opacity-50 pointer-events-none";

function FooterLinkItem({ link }: { link: FooterLink }) {
  switch (link.kind) {
    case "internal":
      return (
        <Link href={link.href} className={LINK_CLASS}>
          {link.label}
        </Link>
      );
    case "external":
      return (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          {link.label}
        </a>
      );
    case "anchor":
      return (
        <a href={link.href} className={LINK_CLASS}>
          {link.label}
        </a>
      );
    case "placeholder":
      return (
        <a
          href="#"
          aria-disabled="true"
          tabIndex={-1}
          className={PLACEHOLDER_CLASS}
        >
          {link.label}
        </a>
      );
  }
}

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card py-15 pb-7">
      <div className="mx-auto grid max-w-300 grid-cols-2 gap-8 px-6 sm:grid-cols-[1.4fr_1fr_1fr_1fr] sm:gap-10">
        <div className="col-span-2 sm:col-span-1">
          <Link
            href="/"
            className="mb-3.5 inline-flex items-center gap-2 text-[16px] font-semibold tracking-tight"
          >
            <DevStashLogoMark />
            <span>DevStash</span>
          </Link>
          <p className="m-0 max-w-70 text-sm text-muted-foreground">
            One hub for all your dev knowledge.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.heading}>
            <h4 className="m-0 mb-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {column.heading}
            </h4>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {column.links.map((link) => (
                <li key={link.label}>
                  <FooterLinkItem link={link} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 flex max-w-300 flex-col gap-1.5 border-t border-border px-6 pt-6 text-center text-[13px] text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <span>© {year} DevStash. All rights reserved.</span>
        <span>Made for developers</span>
      </div>
    </footer>
  );
}
