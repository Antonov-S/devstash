import "server-only";

import OpenAI from "openai";

export { AI_MODEL } from "@/lib/constants";

let cached: { client: OpenAI; apiKey: string } | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export function getOpenAI(): OpenAI {
  const apiKey = requireEnv("OPENAI_API_KEY");
  if (cached && cached.apiKey === apiKey) return cached.client;
  const client = new OpenAI({ apiKey, maxRetries: 2, timeout: 60_000 });
  cached = { client, apiKey };
  return client;
}
