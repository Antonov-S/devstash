import Link from "next/link";

import { DevStashLogoMark } from "@/components/marketing/logo-mark";

// TODO: real links when these routes exist
const RESOURCES = ["Docs", "Blog", "Roadmap", "Support"];
// TODO: real links when these routes exist
const COMPANY = ["About", "Privacy", "Terms", "Contact"];

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

        <div>
          <h4 className="m-0 mb-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Product
          </h4>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
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
                href="#pricing"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Pricing
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
                href="#"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Changelog
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="m-0 mb-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Resources
          </h4>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {RESOURCES.map((label) => (
              <li key={label}>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="m-0 mb-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Company
          </h4>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {COMPANY.map((label) => (
              <li key={label}>
                <a
                  href="#"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-300 flex-col gap-1.5 border-t border-border px-6 pt-6 text-center text-[13px] text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <span>© {year} DevStash. All rights reserved.</span>
        <span>Made for developers</span>
      </div>
    </footer>
  );
}
