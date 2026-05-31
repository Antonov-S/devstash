import type { Metadata } from "next";

import { MarketingProse } from "@/components/marketing/marketing-prose";

export const metadata: Metadata = {
  title: "Changelog · DevStash",
  description:
    "A high-level look at the capabilities that have shipped in DevStash, newest first."
};

// Hand-maintained changelog. Update this by hand when notable features ship —
// there is no generation pipeline and it is intentionally not derived from the
// internal history log. Keep it user-facing: feature names people recognize,
// no file paths, internal IDs, or implementation detail.
type ChangelogGroup = {
  title: string;
  items: string[];
};

const GROUPS: ChangelogGroup[] = [
  {
    title: "AI features (Pro)",
    items: [
      "Auto-tagging — suggest relevant tags from an item's content.",
      "Description generator — one-to-two sentence summaries of an item.",
      "Explain code — a plain-English explanation of a snippet or command, rendered inline.",
      "Optimize prompt — rewrite a prompt with an Original / Refined compare-and-apply flow."
    ]
  },
  {
    title: "Pro plans & billing",
    items: [
      "Pro subscriptions via Stripe — $8/month or $72/year.",
      "Upgrade flow with a clear pricing comparison and a celebratory welcome page.",
      "Self-service billing management through the Stripe customer portal."
    ]
  },
  {
    title: "Files & images",
    items: [
      "Folders — organize files and images into folders; click a folder for a quick-peek drawer with a preview, rename, and delete, then open its full page.",
      "File and image uploads with drag-and-drop and upload progress.",
      "Image gallery view with thumbnails and quick download.",
      "Drive-style file list view with type-aware icons."
    ]
  },
  {
    title: "Search & organization",
    items: [
      "Global command palette (⌘K / Ctrl+K) with fast fuzzy search across items and collections.",
      "Collections — group items freely; an item can live in several collections.",
      "Favorites and pinned items for the things you reach for most.",
      "Pagination across item and collection listings."
    ]
  },
  {
    title: "Editors",
    items: [
      "Code editor with per-language syntax highlighting and a language picker.",
      "Markdown editor with live preview for notes and prompts.",
      "Per-user editor preferences — theme, font size, tab size, word wrap, and minimap."
    ]
  },
  {
    title: "Items",
    items: [
      "Create, edit, and delete snippets, prompts, commands, notes, and links.",
      "Quick-copy any item straight from its card.",
      "A side drawer for viewing and editing item details without leaving the page."
    ]
  },
  {
    title: "Accounts & security",
    items: [
      "Email/password and GitHub sign-in.",
      "Email verification and password reset with secure, expiring links.",
      "Rate limiting across authentication to protect accounts.",
      "Account and settings management, including change password and account deletion."
    ]
  },
  {
    title: "Foundation",
    items: [
      "The core dashboard for browsing and managing your knowledge.",
      "A marketing site introducing DevStash.",
      "Dark and light theming, responsive across devices."
    ]
  }
];

export default function ChangelogPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Changelog
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        A high-level look at what&rsquo;s shipped in DevStash, newest first.
      </p>

      <MarketingProse className="mt-6">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </MarketingProse>
    </article>
  );
}
