import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Window = `${number} ${"s" | "m" | "h"}`;

export type LimiterName =
  | "login"
  | "register"
  | "forgotPassword"
  | "resetPassword"
  | "resendVerification";

const LIMITS: Record<LimiterName, { tokens: number; window: Window }> = {
  login: { tokens: 5, window: "15 m" },
  register: { tokens: 3, window: "1 h" },
  forgotPassword: { tokens: 3, window: "1 h" },
  resetPassword: { tokens: 5, window: "15 m" },
  resendVerification: { tokens: 3, window: "15 m" }
};

let cachedRedis: Redis | null = null;
const cachedLimiters: Partial<Record<LimiterName, Ratelimit>> = {};

function getRedis(): Redis | null {
  if (cachedRedis) return cachedRedis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  cachedRedis = new Redis({ url, token });
  return cachedRedis;
}

function getLimiter(name: LimiterName): Ratelimit | null {
  const existing = cachedLimiters[name];
  if (existing) return existing;
  const redis = getRedis();
  if (!redis) return null;
  const { tokens, window } = LIMITS[name];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `rl:${name}`,
    analytics: false
  });
  cachedLimiters[name] = limiter;
  return limiter;
}

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
  retryAfterSeconds: number;
};

const ALLOWED: RateLimitResult = {
  success: true,
  remaining: Number.POSITIVE_INFINITY,
  reset: 0,
  retryAfterSeconds: 0
};

export async function rateLimit(
  name: LimiterName,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(name);
  if (!limiter) return ALLOWED;

  try {
    const result = await limiter.limit(identifier);
    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((result.reset - Date.now()) / 1000)
    );
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      retryAfterSeconds
    };
  } catch (error) {
    // Fail open so an Upstash outage can't take down auth.
    console.error(`[rate-limit] ${name} failed open due to error`, error);
    return ALLOWED;
  }
}

type HeaderReader = { get(name: string): string | null };

export function extractIp(headers: HeaderReader): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) {
    const trimmed = real.trim();
    if (trimmed) return trimmed;
  }
  return "unknown";
}

export function formatRetryAfter(seconds: number): string {
  if (seconds <= 60) return "a minute";
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

export function rateLimitMessage(result: RateLimitResult): string {
  return `Too many attempts. Please try again in ${formatRetryAfter(
    result.retryAfterSeconds
  )}.`;
}

export function rateLimitJsonResponse(result: RateLimitResult): Response {
  return new Response(JSON.stringify({ error: rateLimitMessage(result) }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(Math.max(1, result.retryAfterSeconds))
    }
  });
}
