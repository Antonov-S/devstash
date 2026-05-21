import type { Metadata } from "next";

import { auth } from "@/auth";
import { AiSection } from "@/components/marketing/ai-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { PricingSection } from "@/components/marketing/pricing-section";

export const metadata: Metadata = {
  title: "DevStash — One hub for all your dev knowledge",
  description:
    "DevStash is a fast, searchable, AI-enhanced hub for developer snippets, prompts, commands, notes, files, and links."
};

export default async function Home() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(800px 600px at 10% -10%, rgba(59, 130, 246, 0.08), transparent 70%), radial-gradient(700px 500px at 90% 10%, rgba(245, 158, 11, 0.06), transparent 70%)"
      }}
    >
      <MarketingNav isAuthenticated={isAuthenticated} />
      <main>
        <HeroSection isAuthenticated={isAuthenticated} />
        <FeaturesSection />
        <AiSection />
        <PricingSection isAuthenticated={isAuthenticated} />
        <CtaSection isAuthenticated={isAuthenticated} />
      </main>
      <MarketingFooter />
    </div>
  );
}
