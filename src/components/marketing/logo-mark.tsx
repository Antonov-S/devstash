import { cn } from "@/lib/utils";

export function DevStashLogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-[26px] items-center justify-center rounded-md text-white",
        className
      )}
      style={{
        background: "linear-gradient(135deg, #60a5fa, #3b82f6)"
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
      >
        <path d="m21 16-9 5-9-5" />
        <path d="m21 12-9 5-9-5" />
        <path d="m3 7 9-5 9 5-9 5-9-5z" />
      </svg>
    </span>
  );
}
