"use client";

import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type InputProps = ComponentProps<typeof Input>;

function FieldIcon({
  children,
  side
}: {
  children: ReactNode;
  side: "left" | "right";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-1/2 flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground",
        side === "left" ? "left-3" : "right-3"
      )}
    >
      {children}
    </span>
  );
}

export function EmailField(props: InputProps) {
  return (
    <div className="relative">
      <FieldIcon side="left">
        <Mail className="size-4" />
      </FieldIcon>
      <Input
        {...props}
        type="email"
        className={cn("h-11 pl-9", props.className)}
      />
    </div>
  );
}

export function PasswordField(props: InputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <FieldIcon side="left">
        <Lock className="size-4" />
      </FieldIcon>
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("h-11 pl-9 pr-10", props.className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {visible ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  );
}

export function IconField({
  icon,
  ...props
}: InputProps & { icon: ReactNode }) {
  return (
    <div className="relative">
      <FieldIcon side="left">{icon}</FieldIcon>
      <Input {...props} className={cn("h-11 pl-9", props.className)} />
    </div>
  );
}
