import "server-only";

import { Resend } from "resend";

// Resend's shared sandbox sender. It only delivers to the Resend account
// owner's own verified address, so it's fine for local/dev but never works
// for real users in production.
const SANDBOX_FROM = "DevStash <onboarding@resend.dev>";

export const EMAIL_VERIFICATION_ENABLED =
  process.env.EMAIL_VERIFICATION_ENABLED !== "false";

/**
 * Pick the email sender for the current environment.
 *
 * - `EMAIL_FROM` set      → use it (production `devstash.xyz` sender, staging, etc.)
 * - unset + non-production → fall back to the Resend sandbox address
 * - unset + production     → throw, so we never silently send from the dead sandbox
 *
 * Pure so it can be unit-tested without mutating `process.env`.
 */
export function resolveFromAddress(env: {
  nodeEnv: string | undefined;
  emailFrom: string | undefined;
}): string {
  const emailFrom = env.emailFrom?.trim();
  if (emailFrom) return emailFrom;
  if (env.nodeEnv === "production") {
    throw new Error(
      "EMAIL_FROM must be set in production — refusing to send from the Resend sandbox address."
    );
  }
  return SANDBOX_FROM;
}

// Resolved lazily (at send time, not import time) so a production `next build`
// with no EMAIL_FROM yet doesn't crash when the module is loaded.
function getFromAddress(): string {
  return resolveFromAddress({
    nodeEnv: process.env.NODE_ENV,
    emailFrom: process.env.EMAIL_FROM
  });
}

/**
 * Strip whitespace and a single pair of surrounding quotes from an API key.
 * Host env-var UIs (Vercel, etc.) often let a `"re_..."` or a trailing newline
 * sneak in, which Resend then rejects as invalid. Returns `undefined` for an
 * empty / whitespace-only value so the caller can treat it as unset.
 *
 * Pure so it can be unit-tested without mutating `process.env`.
 */
export function normalizeApiKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const unquoted = raw.trim().replace(/^["']|["']$/g, "").trim();
  return unquoted || undefined;
}

// Show enough of the key to identify it in logs without leaking it.
function maskKey(key: string): string {
  if (key.length <= 8) return `*** (length ${key.length})`;
  return `${key.slice(0, 5)}…${key.slice(-2)} (length ${key.length})`;
}

/**
 * Turn a Resend send error into an actionable log message. Includes the sender
 * we tried (so an account/domain mismatch is obvious) and a targeted hint for
 * the two failures we actually hit in production: a rejected API key and an
 * unverified sender domain.
 *
 * Pure so it can be unit-tested.
 */
export function formatSendError(
  error: { name?: string; message?: string },
  from: string
): string {
  const base = error.message ?? "unknown error";
  const haystack = `${error.name ?? ""} ${base}`.toLowerCase();

  let hint = "";
  if (
    haystack.includes("api key") ||
    haystack.includes("unauthorized") ||
    haystack.includes("invalid")
  ) {
    hint =
      " — Resend rejected the API key. Confirm RESEND_API_KEY belongs to the SAME Resend" +
      " account where the sender domain is verified, has no surrounding quotes/whitespace," +
      " and that the deployment was rebuilt (not cache-reused) after the value changed.";
  } else if (
    haystack.includes("not verified") ||
    haystack.includes("domain") ||
    haystack.includes("verify")
  ) {
    hint =
      ` — the sender "${from}" is not on a verified domain in this Resend account.` +
      " Verify the domain in Resend (SPF/DKIM) or change EMAIL_FROM to a verified sender.";
  }

  return `Resend send failed (from "${from}"): ${base}${hint}`;
}

let cached: Resend | null = null;

function getResend(): Resend {
  if (cached) return cached;
  const apiKey = normalizeApiKey(process.env.RESEND_API_KEY);
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set (or is empty after trimming quotes/whitespace)."
    );
  }
  if (!apiKey.startsWith("re_")) {
    console.warn(
      `[email] RESEND_API_KEY does not look like a Resend key — expected a "re_" prefix, ` +
        `got ${maskKey(apiKey)}. Check the value in your host's environment variables.`
    );
  }
  cached = new Resend(apiKey);
  return cached;
}

export async function sendVerificationEmail({
  to,
  name,
  verifyUrl
}: {
  to: string;
  name: string | null;
  verifyUrl: string;
}): Promise<void> {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const html = `<!doctype html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#0a0a0a; color:#fafafa; padding:32px;">
    <div style="max-width:480px; margin:0 auto; background:#111; border:1px solid #262626; border-radius:12px; padding:32px;">
      <h1 style="margin:0 0 16px; font-size:20px;">Verify your email</h1>
      <p style="margin:0 0 16px; line-height:1.5; color:#d4d4d4;">${greeting}</p>
      <p style="margin:0 0 24px; line-height:1.5; color:#d4d4d4;">
        Welcome to DevStash. Click the button below to verify your email address and activate your account.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${verifyUrl}" style="display:inline-block; background:#fafafa; color:#0a0a0a; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:600;">
          Verify email
        </a>
      </p>
      <p style="margin:0 0 8px; line-height:1.5; color:#a3a3a3; font-size:13px;">
        Or paste this link into your browser:
      </p>
      <p style="margin:0 0 24px; word-break:break-all; color:#a3a3a3; font-size:13px;">
        <a href="${verifyUrl}" style="color:#a3a3a3;">${verifyUrl}</a>
      </p>
      <p style="margin:0; color:#737373; font-size:12px;">
        This link expires in 24 hours. If you didn't create a DevStash account, you can ignore this email.
      </p>
    </div>
  </body>
</html>`;

  const text = `${greeting}

Welcome to DevStash. Verify your email address by opening this link (expires in 24 hours):

${verifyUrl}

If you didn't create a DevStash account, you can ignore this email.`;

  const from = getFromAddress();
  const { error } = await getResend().emails.send({
    from,
    to,
    subject: "Verify your DevStash email",
    html,
    text
  });

  if (error) {
    throw new Error(formatSendError(error, from));
  }
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl
}: {
  to: string;
  name: string | null;
  resetUrl: string;
}): Promise<void> {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const html = `<!doctype html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#0a0a0a; color:#fafafa; padding:32px;">
    <div style="max-width:480px; margin:0 auto; background:#111; border:1px solid #262626; border-radius:12px; padding:32px;">
      <h1 style="margin:0 0 16px; font-size:20px;">Reset your password</h1>
      <p style="margin:0 0 16px; line-height:1.5; color:#d4d4d4;">${greeting}</p>
      <p style="margin:0 0 24px; line-height:1.5; color:#d4d4d4;">
        We received a request to reset the password on your DevStash account. Click the button below to choose a new one.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${resetUrl}" style="display:inline-block; background:#fafafa; color:#0a0a0a; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:600;">
          Reset password
        </a>
      </p>
      <p style="margin:0 0 8px; line-height:1.5; color:#a3a3a3; font-size:13px;">
        Or paste this link into your browser:
      </p>
      <p style="margin:0 0 24px; word-break:break-all; color:#a3a3a3; font-size:13px;">
        <a href="${resetUrl}" style="color:#a3a3a3;">${resetUrl}</a>
      </p>
      <p style="margin:0; color:#737373; font-size:12px;">
        This link expires in 1 hour. If you didn't ask to reset your password, you can safely ignore this email — your account is unchanged.
      </p>
    </div>
  </body>
</html>`;

  const text = `${greeting}

We received a request to reset the password on your DevStash account. Open this link to choose a new one (expires in 1 hour):

${resetUrl}

If you didn't ask to reset your password, you can safely ignore this email — your account is unchanged.`;

  const from = getFromAddress();
  const { error } = await getResend().emails.send({
    from,
    to,
    subject: "Reset your DevStash password",
    html,
    text
  });

  if (error) {
    throw new Error(formatSendError(error, from));
  }
}
