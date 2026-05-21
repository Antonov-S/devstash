import { SYSTEM_TYPE_COLORS } from "@/lib/constants";
import { Reveal } from "@/components/marketing/reveal";

type Feature = {
  title: string;
  description: string;
  accent: string;
  icon: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    title: "Code Snippets",
    description:
      "Syntax-highlighted snippets with copy-to-clipboard, language detection, and tag support.",
    accent: SYSTEM_TYPE_COLORS.snippet,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    )
  },
  {
    title: "AI Prompts",
    description:
      "Save the prompts that actually worked, reuse them, and let DevStash optimize them.",
    accent: SYSTEM_TYPE_COLORS.prompt,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v4" />
        <path d="M12 17v4" />
        <path d="M5 12H1" />
        <path d="M23 12h-4" />
        <path d="m18.36 5.64-2.83 2.83" />
        <path d="m8.46 15.54-2.82 2.82" />
        <path d="m5.64 5.64 2.83 2.83" />
        <path d="m15.54 15.54 2.82 2.82" />
      </svg>
    )
  },
  {
    title: "Instant Search",
    description:
      "⌘K opens a fuzzy palette across every item, tag, and collection in your stash.",
    accent: SYSTEM_TYPE_COLORS.link,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    )
  },
  {
    title: "Commands",
    description:
      "That obscure CLI flag you Googled twice this week? Stash it once, never search again.",
    accent: SYSTEM_TYPE_COLORS.command,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    )
  },
  {
    title: "Files & Docs",
    description:
      "Drop in PDFs, configs, diagrams, and architecture notes — keep context with the code.",
    accent: SYSTEM_TYPE_COLORS.file,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    )
  },
  {
    title: "Collections",
    description:
      "Group anything with anything. An item can live in as many collections as you want.",
    accent: SYSTEM_TYPE_COLORS.note,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    )
  }
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-t border-border py-18 sm:py-25"
    >
      <div className="mx-auto max-w-300 px-6">
        <Reveal className="mx-auto mb-9 max-w-180 text-center sm:mb-14">
          <span className="mb-4.5 inline-block rounded-full border border-border bg-card px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            Features
          </span>
          <h2 className="my-1 text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.15] tracking-tight">
            Everything you save, in one fast place
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Seven item types, infinite collections, and a search that finds
            what you actually meant.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Reveal
              key={feature.title}
              as="article"
              className="group/feat relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-7 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5"
              style={
                {
                  ["--feat-accent" as string]: feature.accent
                } as React.CSSProperties
              }
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/feat:opacity-100"
                style={{
                  background: `radial-gradient(280px 200px at 0% 0%, color-mix(in srgb, ${feature.accent} 18%, transparent), transparent 65%)`
                }}
              />
              <div
                className="relative mb-4.5 inline-flex size-11 items-center justify-center rounded-[10px] [&_svg]:size-5.5"
                style={{
                  background: `color-mix(in srgb, ${feature.accent} 14%, var(--card))`,
                  border: `1px solid color-mix(in srgb, ${feature.accent} 35%, var(--border))`,
                  color: feature.accent
                }}
              >
                {feature.icon}
              </div>
              <h3 className="relative mb-1.5 text-lg font-semibold tracking-[-0.01em]">
                {feature.title}
              </h3>
              <p className="relative m-0 text-[14.5px] leading-[1.55] text-muted-foreground">
                {feature.description}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
