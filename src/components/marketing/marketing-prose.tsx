import { cn } from "@/lib/utils";

/**
 * Lightweight, theme-aware prose wrapper for long-form marketing/legal pages
 * (privacy, terms, changelog). Styles its children via child-element selector
 * classes on a single root — no @tailwindcss/typography, no .markdown-preview.
 *
 * Each page supplies its own <h1> + "Last updated" line above this wrapper, so
 * h1 styling lives on the page. This handles h2/h3, paragraphs, lists, links,
 * and inline strong/code using foreground/muted-foreground tokens so it reads
 * on both dark (default) and light themes.
 */
export function MarketingProse({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "[&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground",
        "[&_p]:my-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground",
        "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
        "[&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-muted-foreground",
        "[&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors hover:[&_a]:text-primary",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.8125rem]",
        className
      )}
    >
      {children}
    </div>
  );
}
