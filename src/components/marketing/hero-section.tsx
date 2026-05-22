import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ChaosStage } from "@/components/marketing/chaos-stage";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

type Props = {
  isAuthenticated: boolean;
};

export function HeroSection({ isAuthenticated }: Props) {
  return (
    <header className="relative overflow-hidden pt-27.5 pb-15 sm:pt-35 sm:pb-20">
      <div className="mx-auto flex max-w-300 flex-col gap-11 px-6 sm:gap-15">
        <Reveal className="mx-auto max-w-205 text-center">
          <span className="mb-4.5 inline-block rounded-full border border-border bg-card px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            Knowledge hub for developers
          </span>
          <h1 className="my-1 text-[clamp(36px,5.4vw,64px)] font-bold leading-[1.05] tracking-tight">
            Stop Losing Your{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #f59e0b 100%)"
              }}
            >
              Developer Knowledge
            </span>
          </h1>
          <p className="mx-auto mt-4.5 mb-7 max-w-165 text-[clamp(16px,1.6vw,19px)] leading-[1.55] text-muted-foreground">
            Your snippets live in VS Code, prompts in ChatGPT, commands in your
            shell history, notes in Notion. DevStash brings it all into one
            fast, searchable, AI-enhanced hub.
          </p>
          <div className="inline-flex flex-wrap items-center justify-center gap-3">
            <Link
              href={isAuthenticated ? "/dashboard" : "/register"}
              className={cn(buttonVariants({ variant: "default", size: "lg" }))}
            >
              {isAuthenticated ? "Open dashboard" : "Start for Free"}
            </Link>
            <Link
              href="#features"
              className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
            >
              See Features →
            </Link>
          </div>
          <p className="mt-4.5 text-[13px] text-muted-foreground/80">
            Free forever for 50 items · No credit card required
          </p>
        </Reveal>

        <Reveal className="grid w-full grid-cols-1 items-stretch gap-7 lg:grid-cols-[1fr_auto_1.15fr]">
          <figure className="m-0 flex flex-col">
            <figcaption className="mb-2.5 text-center text-xs uppercase tracking-[0.06em] text-muted-foreground">
              Your knowledge today…
            </figcaption>
            <ChaosStage />
          </figure>

          <div
            aria-hidden="true"
            className="self-center justify-self-center rotate-90 text-primary lg:rotate-0"
            style={{
              width: 64,
              height: 64,
              filter: "drop-shadow(0 0 14px rgba(59, 130, 246, 0.45))"
            }}
          >
            <div className="animate-arrow-pulse size-full">
              <svg
                viewBox="0 0 64 64"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 32h48" />
                <path d="M40 16l16 16-16 16" />
              </svg>
            </div>
          </div>

          <DashboardPreview />
        </Reveal>
      </div>
    </header>
  );
}
