import { headers } from "next/headers";

export async function getBaseUrl(): Promise<string> {
  const env = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (env) return env.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto =
    h.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  if (!host) throw new Error("Unable to determine base URL");
  return `${proto}://${host}`;
}
