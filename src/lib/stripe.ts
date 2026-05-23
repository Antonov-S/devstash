import "server-only";

import Stripe from "stripe";

// Pinned to the latest stable Stripe API version as of 2026-05.
// Bump together with the `stripe` package; the SDK's `LatestApiVersion`
// type union narrows what's accepted here.
const STRIPE_API_VERSION = "2025-02-24.acacia" as const;

let cached: { client: Stripe; secretKey: string } | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export function getStripe(): Stripe {
  const secretKey = requireEnv("STRIPE_SECRET_KEY");
  if (cached && cached.secretKey === secretKey) return cached.client;

  const client = new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true
  });

  cached = { client, secretKey };
  return client;
}

export const STRIPE_PRICE_IDS = {
  monthly: () => requireEnv("STRIPE_PRICE_ID_MONTHLY"),
  yearly: () => requireEnv("STRIPE_PRICE_ID_YEARLY")
} as const;

export type BillingPeriod = keyof typeof STRIPE_PRICE_IDS;
