import Link from "next/link";

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-sm font-semibold"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
          DS
        </span>
        DevStash
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
