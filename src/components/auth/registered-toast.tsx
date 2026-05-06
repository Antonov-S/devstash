"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function RegisteredToast() {
  const router = useRouter();
  const params = useSearchParams();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (params.get("registered") !== "1") return;
    fired.current = true;

    toast.success("Account created. You can now sign in.");

    const next = new URLSearchParams(params);
    next.delete("registered");
    const qs = next.toString();
    router.replace(qs ? `/sign-in?${qs}` : "/sign-in");
  }, [params, router]);

  return null;
}
