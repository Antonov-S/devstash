import { auth } from "@/auth";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export default async function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return (
    <>
      <MarketingNav isAuthenticated={isAuthenticated} />
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 pt-24 pb-10 sm:pt-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,--theme(--color-primary/12%)_0%,transparent_55%),radial-gradient(ellipse_at_bottom,--theme(--color-primary/6%)_0%,transparent_60%)]"
        />
        <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl shadow-black/20 backdrop-blur-sm duration-300 animate-in fade-in slide-in-from-bottom-2 sm:p-8 dark:bg-card/40">
          {children}
        </div>
      </div>
    </>
  );
}
