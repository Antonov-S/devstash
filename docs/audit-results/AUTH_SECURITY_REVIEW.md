# Auth Security Review

**Last audited:** 2026-05-09
**Auditor:** auth-auditor agent (run inline; agent file at `.claude/agents/auth-auditor.md` not yet loaded by Claude Code)
**Scope:** Authentication, email verification, password reset, profile mutations
**Stack:** NextAuth v5 (`5.0.0-beta.31`), Prisma 7, bcryptjs `3.0.3`, Resend, Next.js 16 App Router

## Summary

- Critical: 0
- High: 2
- Medium: 4
- Low: 2

---

## Critical

No issues found.

---

## High

### 1. Host header injection in `getBaseUrl()` enables verification / reset link poisoning

- **Area:** Email verification & password reset
- **File:** `src/lib/base-url.ts`
- **Lines:** 3-14
- **Problem:** When neither `AUTH_URL` nor `NEXTAUTH_URL` is set, `getBaseUrl()` falls back to the request `X-Forwarded-Host` / `Host` headers. Both are attacker-controllable values. The function is consumed by [register/route.ts:88-89](src/app/api/auth/register/route.ts#L88-L89), [resend-verification/route.ts:51-52](src/app/api/auth/resend-verification/route.ts#L51-L52), and [forgot-password/route.ts:46-47](src/app/api/auth/forgot-password/route.ts#L46-L47) to build the link delivered by Resend.
- **Why it matters:** Classic Host-header poisoning → password-reset poisoning. An attacker submits `POST /api/auth/forgot-password` for the victim with a spoofed `Host: attacker.com`, the email arrives with `https://attacker.com/reset-password?token=...`, the victim clicks, and the attacker captures the token. They replay it on the real domain to take over the account. Same vector applies to verification tokens (account hijack on first sign-up).
- **Suggested Fix:** Require `AUTH_URL` (or `NEXTAUTH_URL`) and remove the header fallback entirely. If a runtime fallback is needed, validate against an allowlist of trusted hosts.

```ts
// src/lib/base-url.ts
export function getBaseUrl(): string {
  const env = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (!env) {
    throw new Error("AUTH_URL must be set — refusing to build URLs from request headers");
  }
  return env.replace(/\/$/, "");
}
```

Also update the call sites: drop the `await` since the function no longer needs `headers()`.

---

### 2. No rate limiting on any auth endpoint

- **Area:** Rate limiting / brute force protection
- **Files:**
  - `src/app/api/auth/[...nextauth]/route.ts` (sign-in handler)
  - `src/app/api/auth/register/route.ts`
  - `src/app/api/auth/forgot-password/route.ts`
  - `src/app/api/auth/resend-verification/route.ts`
  - `src/app/api/auth/reset-password/route.ts`
  - `src/app/api/account/change-password/route.ts`
- **Lines:** entire route handlers
- **Problem:** A repo-wide grep for `rate.?limit|ratelimit|Ratelimit` returned zero matches. None of these endpoints throttle requests per IP or per account.
- **Why it matters:**
  - Sign-in: unbounded credential stuffing / brute force against `bcryptjs.compare` (cost 10 ≈ ~80 ms/check, but trivial to parallelize).
  - Forgot-password / resend-verification: email bombing — an attacker can flood any registered address with reset / verification mails (free Resend usage burn + reputational damage + inbox harassment).
  - Reset-password: enables a token-guessing attempt, though entropy makes this impractical.
  - Change-password: post-auth, but still worth limiting to slow session-hijack abuse.
- **Suggested Fix:** Add a token-bucket limiter at every endpoint. Recommended: `@upstash/ratelimit` once Redis is provisioned (the project's tech stack already lists Redis as TBD). Practical thresholds:
  - Sign-in: 5 / IP / 15 min, 10 / email / hour
  - Register: 3 / IP / hour
  - Forgot-password & resend-verification: 3 / IP / hour, 5 / email / 24 h (and dedupe outstanding tokens — the create function already overwrites, so no row build-up)
  - Change-password: 5 / user / hour

```ts
// example wrapper
import { Ratelimit } from "@upstash/ratelimit";
const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "15 m") });
const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
const { success } = await limiter.limit(`signin:${ip}`);
if (!success) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
```

---

## Medium

### 3. Password reset / change does not invalidate existing sessions

- **Area:** Session validation
- **Files:**
  - `src/app/api/auth/reset-password/route.ts`
  - `src/app/api/account/change-password/route.ts`
- **Lines:** reset-password 57-66; change-password 80-86
- **Problem:** After a successful password update, prior JWT sessions remain valid until their natural expiry. The session strategy is JWT (`auth.ts:17`), so there is no `Session` row to delete — but currently nothing invalidates issued tokens either.
- **Why it matters:** If a session cookie is stolen and the user resets the password to recover, the attacker's stolen JWT keeps working until expiration. Industry guidance (OWASP ASVS 3.7.2, NIST 800-63B 5.1.1.2) is to invalidate all sessions on credential change.
- **Suggested Fix:** Add a `passwordVersion: Int @default(0)` column to `User`. Increment it on every password write. Embed it in the JWT (`jwt` callback) and check it in the `session` callback — when the embedded version no longer matches the DB row, throw to force re-auth.

```prisma
// schema.prisma
model User {
  // ...
  passwordVersion Int @default(0)
}
```

```ts
// auth.config.ts
async jwt({ token, user, trigger }) {
  if (user) { token.id = user.id; token.pv = (user as any).passwordVersion ?? 0; }
  return token;
},
async session({ session, token }) {
  const fresh = await prisma.user.findUnique({
    where: { id: token.id as string },
    select: { passwordVersion: true },
  });
  if (!fresh || fresh.passwordVersion !== token.pv) throw new Error("session invalid");
  // ...
}
```

---

### 4. Register is vulnerable to a duplicate-email race; `P2002` not handled

- **Area:** Registration
- **File:** `src/app/api/auth/register/route.ts`
- **Lines:** 56-77
- **Problem:** The endpoint does a `findUnique` for the email and then a separate `prisma.user.create`. Two concurrent requests with the same email will both pass the existence check; one will then crash with Prisma `P2002` (unique constraint violation) and surface as an unhandled 500 to the client.
- **Why it matters:** The unique constraint guarantees data integrity, but the missing catch produces a confusing 500 and leaks Prisma internals via `console.error`. It's a correctness bug rather than a security exploit, but worth fixing alongside the enumeration finding below.
- **Suggested Fix:** Wrap the `create` in a try/catch and treat `P2002` as the existing-account branch.

```ts
try {
  const user = await prisma.user.create({ data: { ... }, select: { ... } });
} catch (err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }
  throw err;
}
```

---

### 5. Register endpoint enables account enumeration

- **Area:** Registration
- **File:** `src/app/api/auth/register/route.ts`
- **Lines:** 60-65
- **Problem:** A duplicate email triggers a distinct `409 "An account with that email already exists"` response, while a fresh email returns `201`. An attacker can probe arbitrary addresses to learn whether they have an account.
- **Why it matters:** Combined with the unrate-limited register endpoint (finding #2), an attacker can enumerate every email in the DB. Pairs with credential stuffing on the sign-in endpoint.
- **Suggested Fix:** Two reasonable options, pick one:
  - (A) Always return 201 with a generic message and silently send a "you already have an account — sign in" email to the existing address (preferred, matches Stripe / GitHub behavior).
  - (B) Keep the 409 but require rate limiting (finding #2) and CAPTCHA on this endpoint to make enumeration costly. Document the trade-off.

---

### 6. Middleware (`proxy.ts`) only protects `/dashboard`, not other authed pages

- **Area:** Session validation
- **File:** `src/proxy.ts`
- **Lines:** 7-16
- **Problem:** The proxy redirects unauthenticated visitors only when the path starts with `/dashboard`. The profile route (`src/app/(dashboard)/profile/page.tsx`) lives in the `(dashboard)` route group, but the URL it renders at is `/profile` — the parentheses don't appear in the URL — so the middleware never runs the auth gate on it. The page itself does call `auth()` at line 34-35, so today it's safe; this is a defense-in-depth gap, not a live exposure.
- **Why it matters:** Any future page added to the `(dashboard)` group that forgets the per-page `auth()` call will silently render to anonymous visitors. The grouping suggests "this folder is protected" but the middleware doesn't enforce that suggestion.
- **Suggested Fix:** Either (a) widen the middleware to match every authed prefix:

```ts
// proxy.ts
const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/items", "/collections", "/settings"];
const isProtected = PROTECTED_PREFIXES.some(p => req.nextUrl.pathname.startsWith(p));
if (isProtected && !req.auth) { /* redirect */ }
```

or (b) move authed pages under a real `/dashboard/...` URL prefix so the existing matcher covers them.

---

## Low

### 7. Password policy is length-only; no complexity / breach check

- **Area:** Registration & password reset
- **Files:** `src/app/api/auth/register/route.ts:11`, `src/app/api/auth/reset-password/route.ts:9`, `src/app/api/account/change-password/route.ts:9`
- **Problem:** All three enforce `MIN_PASSWORD_LENGTH = 8` and nothing else.
- **Why it matters:** 8 chars meets NIST 800-63B section 5.1.1.2 (8+ minimum), so this is acceptable, not a bug. NIST explicitly discourages composition rules. The strongest hardening is checking new passwords against a known-breached corpus (HIBP `pwnedpasswords` API has a free k-anonymity range endpoint that doesn't transmit the password).
- **Suggested Fix (optional hardening):** Bump minimum to 10 and call HIBP range API on register / change / reset. If the password's SHA-1 prefix returns a hit, reject with "this password has appeared in a data breach."

---

### 8. Account deletion does not require re-authentication

- **Area:** Profile mutations
- **File:** `src/actions/account.ts`
- **Lines:** 8-19
- **Problem:** `deleteAccountAction` only checks `session?.user?.id`. The client gates with a typed `"DELETE"` confirmation, but that's UI-only — anything with a valid session cookie can call the action. Next.js Server Actions do have framework-level CSRF protection (the `Next-Action` header is origin-checked), so this isn't a CSRF hole, but a stolen / hijacked session is the typical destructive-action risk.
- **Why it matters:** Industry norm for irreversible destructive operations is to require a fresh credential proof (current password). This raises the bar from "session theft" to "session theft + password theft."
- **Suggested Fix:** Accept `currentPassword` from the client, re-validate via `bcryptjs.compare`, then proceed. For OAuth-only users who have no password, fall back to either an additional confirmation email link or `signIn("github")` re-auth.

---

## Passed Checks

Specific, verified-good practices in the current codebase:

- ✅ Verification and reset tokens use **256 bits of entropy** via `randomBytes(32).toString("hex")` (`src/lib/verification-token.ts:28`, `:68`).
- ✅ Tokens are **SHA-256 hashed** before being stored — only the hash hits the DB (`src/lib/verification-token.ts:21`, used at `:33-34`, `:73-75`).
- ✅ Tokens are **single-use** — `prisma.verificationToken.delete` is called before the expiry check, so even an expired token is consumed by the lookup (`verification-token.ts:55`, `:116`).
- ✅ **Cross-purpose token isolation** — verification consumer rejects identifiers containing `:` (`verification-token.ts:53`); reset consumer rejects identifiers without the `password-reset:` prefix (`verification-token.ts:91`, `:112`).
- ✅ Verify endpoint uses `updateMany` scoped to `email + emailVerified: null`, preventing replay against an already-verified user (`src/app/api/auth/verify/route.ts:23-26`).
- ✅ `forgot-password` returns identical `200 { success: true }` for missing accounts and OAuth-only accounts (`src/app/api/auth/forgot-password/route.ts:40-42`, `:61`).
- ✅ `resend-verification` returns identical `200` for missing, already-verified, and OAuth-only accounts (`src/app/api/auth/resend-verification/route.ts:45-46`).
- ✅ `EMAIL_VERIFICATION_ENABLED=false` correctly short-circuits resend to the same generic 200 (`resend-verification/route.ts:32-34`), preserving the no-leak behavior in dev mode.
- ✅ Email normalization (`trim().toLowerCase()`) is applied consistently on register, credentials sign-in, resend, and forgot-password (`auth.ts:45`, `register/route.ts:54`, `resend-verification/route.ts:36`, `forgot-password/route.ts:30`).
- ✅ Credential validation uses `bcryptjs.compare` (constant-time) — never `===` (`auth.ts:51`, `change-password/route.ts:65`, `:73`).
- ✅ `events.linkAccount` only marks `emailVerified` when the linked provider is GitHub — does not auto-verify on every link (`auth.ts:19-26`).
- ✅ `EmailNotVerifiedError` is thrown **after** password validation succeeds, server-side (`auth.ts:54-56`); the gate is enforced in `authorize`, not the UI.
- ✅ Profile page redirects unauthenticated requests and scopes every read to `session.user.id` — no client-supplied IDs (`src/app/(dashboard)/profile/page.tsx:34-43`).
- ✅ `change-password` re-validates the current password before accepting a new one and rejects identical reuse (`change-password/route.ts:65-78`).
- ✅ `deleteAccountAction` checks the session and uses `session.user.id` — never trusts a client-supplied user id (`src/actions/account.ts:10-16`).
- ✅ `User.email` has a unique DB constraint and `User → Account/Session/Item/Collection/ItemType` cascade on delete, so account removal is clean (`prisma/schema.prisma:19`, `:52`, etc.).
- ✅ Hashes never returned to the client — `getUserProfileById` selects `password` only to derive a boolean `hasPassword` and never includes the hash in its return (`src/lib/db/users.ts:46-63`).
- ✅ `bcryptjs` cost factor of 10 (`SALT_ROUNDS = 10` in register, reset, change-password) meets the OWASP Password Storage Cheat Sheet minimum.

---

## Notes

- **`.env` exposure** was checked and confirmed gitignored (`.gitignore:34`); not flagged.
- **Pro gate** intentionally not enforced during development per project context; not flagged.
- **Auth tests** are deferred per project guidelines; not flagged.
- **NextAuth-handled defaults** (CSRF on `/api/auth/*`, session cookie flags, OAuth `state`/PKCE, JWT signing) are intentionally excluded from this report — flagging them would be a false positive.
- **Server Action CSRF** is handled by Next.js's built-in `Next-Action` origin check and is therefore not flagged on `deleteAccountAction`. The Low finding on that action is about destructive-action re-auth, not CSRF.
- **`getBaseUrl()` host fallback** is the highest-impact finding because the practical attack — password-reset poisoning — leads directly to account takeover. Fix this before going to production with `AUTH_URL` unset.
