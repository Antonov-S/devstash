import { auth } from "@/auth";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export default async function MarketingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MarketingNav isAuthenticated={isAuthenticated} />
      <main className="flex-1 pt-24 pb-10 sm:pt-28">
        <div className="mx-auto w-full max-w-3xl px-6">{children}</div>
      </main>
      <MarketingFooter />
    </div>
  );
}
