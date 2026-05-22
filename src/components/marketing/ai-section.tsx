import { Reveal } from "@/components/marketing/reveal";

const CHECKLIST = [
  {
    title: "Auto-tag suggestions",
    description: "Relevant tags inferred from item content."
  },
  {
    title: "One-line summaries",
    description: "Skim long notes and prompts at a glance."
  },
  {
    title: "Explain this code",
    description: "Plain-English breakdown of any snippet."
  },
  {
    title: "Prompt optimizer",
    description: "Rewrite messy prompts for clarity and consistency."
  }
];

const TAGS = ["react", "hooks", "typescript", "debounce", "utility"];

function Check({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function AiSection() {
  return (
    <section
      id="ai"
      className="scroll-mt-20 border-t border-border py-18 sm:py-25"
      style={{
        background:
          "linear-gradient(180deg, transparent, rgba(59, 130, 246, 0.04))"
      }}
    >
      <div className="mx-auto grid max-w-300 grid-cols-1 items-center gap-10 px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <Reveal>
          <span
            className="mb-4.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.04em]"
            style={{
              background:
                "linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(236, 72, 153, 0.16))",
              borderColor: "rgba(245, 158, 11, 0.35)",
              color: "#fcd34d"
            }}
          >
            Pro Feature
          </span>
          <h2 className="m-0 mb-3.5 text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.15] tracking-tight">
            Your stash, but smarter
          </h2>
          <p className="m-0 mb-6 text-base text-muted-foreground">
            DevStash Pro uses <strong>gpt-4o-mini</strong> to make your
            knowledge work for you — auto-tagging, summaries, explanations, and
            prompt rewrites.
          </p>
          <ul className="flex flex-col gap-3.5">
            {CHECKLIST.map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex size-5.5 shrink-0 items-center justify-center rounded-full border"
                  style={{
                    background: "rgba(34, 197, 94, 0.15)",
                    borderColor: "rgba(34, 197, 94, 0.35)",
                    color: "#4ade80"
                  }}
                >
                  <Check className="size-3" />
                </span>
                <div>
                  <strong className="block font-semibold text-foreground">
                    {item.title}
                  </strong>
                  <span className="text-sm text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-border bg-[#0d0d10] shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-3.5 border-b border-border bg-[#171719] px-3.5 py-2.5">
              <span className="inline-flex gap-1.5">
                <span className="size-2.75 rounded-full bg-[#ff5f56]" />
                <span className="size-2.75 rounded-full bg-[#ffbd2e]" />
                <span className="size-2.75 rounded-full bg-[#27c93f]" />
              </span>
              <span className="font-mono text-[11px] tracking-[0.04em] text-muted-foreground">
                typescript
              </span>
            </div>
            <pre className="m-0 overflow-x-auto whitespace-pre p-5 font-mono text-[13px] leading-[1.6] text-[#cdd6e3]">
              <span className="text-[#c084fc]">export function</span>{" "}
              <span className="text-[#60a5fa]">useDebounce</span>
              {"<T>(value: T, delay "}
              <span className="text-[#f472b6]">=</span>
              {" 300) {\n  "}
              <span className="text-[#c084fc]">const</span>
              {" [debounced, setDebounced] "}
              <span className="text-[#f472b6]">=</span>
              {" useState(value);\n  "}
              <span className="text-[#60a5fa]">useEffect</span>
              {"(() "}
              <span className="text-[#f472b6]">{"=>"}</span>
              {" {\n    "}
              <span className="text-[#c084fc]">const</span>
              {" id "}
              <span className="text-[#f472b6]">=</span>
              {" setTimeout(() "}
              <span className="text-[#f472b6]">{"=>"}</span>
              {" setDebounced(value), delay);\n    "}
              <span className="text-[#c084fc]">return</span>
              {" () "}
              <span className="text-[#f472b6]">{"=>"}</span>
              {" clearTimeout(id);\n  }, [value, delay]);\n  "}
              <span className="text-[#c084fc]">return</span>
              {" debounced;\n}"}
            </pre>
            <div className="border-t border-border bg-[#131316] px-4.5 py-3.5">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                AI-generated tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TAGS.map((tag, i) => (
                  <span
                    key={tag}
                    className="animate-tag-in inline-flex items-center rounded-full border px-2.5 py-1 text-xs"
                    style={{
                      background: "rgba(59, 130, 246, 0.12)",
                      borderColor: "rgba(59, 130, 246, 0.35)",
                      color: "#93c5fd",
                      animationDelay: `${i * 120}ms`
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
