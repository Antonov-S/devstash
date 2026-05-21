import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

type Props = {
  isAuthenticated: boolean;
};

export function CtaSection({ isAuthenticated }: Props) {
  return (
    <section
      className="border-t border-border py-25 sm:py-27.5 text-center"
      style={{
        background:
          "radial-gradient(700px 380px at 50% 100%, rgba(59, 130, 246, 0.12), transparent 70%)"
      }}
    >
      <Reveal className="mx-auto max-w-300 px-6">
        <h2 className="m-0 mb-3 text-[clamp(30px,3.6vw,44px)] font-bold tracking-tight">
          Ready to organize your knowledge?
        </h2>
        <p className="m-0 mb-7 text-[17px] text-muted-foreground">
          Join the developers who stopped retyping the same regex.
        </p>
        <Link
          href={isAuthenticated ? "/dashboard" : "/register"}
          className={cn(buttonVariants({ variant: "default", size: "lg" }))}
        >
          {isAuthenticated ? "Open dashboard" : "Get DevStash Free"}
        </Link>
      </Reveal>
    </section>
  );
}
