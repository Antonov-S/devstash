import { SYSTEM_TYPE_COLORS } from "@/lib/constants";

type DashCard = {
  title: string;
  meta: string;
  accent: string;
};

const DASH_CARDS: DashCard[] = [
  {
    title: "useDebounce hook",
    meta: "snippet · ts",
    accent: SYSTEM_TYPE_COLORS.snippet
  },
  {
    title: "Code review prompt",
    meta: "prompt",
    accent: SYSTEM_TYPE_COLORS.prompt
  },
  {
    title: "docker prune all",
    meta: "command",
    accent: SYSTEM_TYPE_COLORS.command
  },
  {
    title: "Sprint planning",
    meta: "note",
    accent: SYSTEM_TYPE_COLORS.note
  },
  {
    title: "shadcn/ui",
    meta: "link",
    accent: SYSTEM_TYPE_COLORS.link
  },
  {
    title: "architecture.png",
    meta: "image",
    accent: SYSTEM_TYPE_COLORS.image
  }
];

const SIDE_NAV = [
  { label: "Snippets", color: SYSTEM_TYPE_COLORS.snippet },
  { label: "Prompts", color: SYSTEM_TYPE_COLORS.prompt },
  { label: "Commands", color: SYSTEM_TYPE_COLORS.command },
  { label: "Notes", color: SYSTEM_TYPE_COLORS.note },
  { label: "Links", color: SYSTEM_TYPE_COLORS.link }
];

const SIDE_COLLECTIONS = [
  { label: "React Patterns", color: SYSTEM_TYPE_COLORS.snippet },
  { label: "AI Prompts", color: SYSTEM_TYPE_COLORS.prompt }
];

export function DashboardPreview() {
  return (
    <figure className="m-0 flex flex-col">
      <figcaption className="mb-2.5 text-center text-xs uppercase tracking-[0.06em] text-muted-foreground">
        …with DevStash
      </figcaption>
      <div className="grid min-h-80 flex-1 grid-cols-[132px_1fr] overflow-hidden rounded-2xl border border-border bg-[#0f0f12] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] sm:min-h-90 sm:grid-cols-[168px_1fr]">
        <aside className="flex flex-col gap-3.5 border-r border-border bg-[#0a0a0b] p-3">
          <div className="flex items-center gap-2 px-1.5 py-1 text-[13px] font-semibold">
            <span
              aria-hidden="true"
              className="inline-flex size-5.5 items-center justify-center rounded-[5px] text-white"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.25"
              >
                <path d="m21 16-9 5-9-5" />
                <path d="m21 12-9 5-9-5" />
                <path d="m3 7 9-5 9 5-9 5-9-5z" />
              </svg>
            </span>
            <span>DevStash</span>
          </div>
          <ul className="flex flex-col gap-0.5">
            {SIDE_NAV.map((row) => (
              <li
                key={row.label}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] text-muted-foreground"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: row.color }}
                />
                {row.label}
              </li>
            ))}
          </ul>
          <div>
            <div className="px-2 pb-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              Collections
            </div>
            <ul className="flex flex-col gap-0.5">
              {SIDE_COLLECTIONS.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center gap-2 rounded-md px-2 py-1.25 text-[11.5px] text-muted-foreground"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: row.color }}
                  />
                  {row.label}
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <main className="flex min-w-0 flex-col gap-3 p-3.5">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-xs text-muted-foreground">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
            <span className="flex-1">Search…</span>
            <kbd className="rounded border border-border bg-[#0f0f12] px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
            {DASH_CARDS.map((card) => (
              <div
                key={card.title}
                className="flex min-h-16 flex-col justify-between gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2"
                style={{ borderTop: `3px solid ${card.accent}` }}
              >
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] font-semibold text-foreground">
                  {card.title}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {card.meta}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </figure>
  );
}
