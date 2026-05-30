import type { Metadata } from "next";

import { MarketingProse } from "@/components/marketing/marketing-prose";

export const metadata: Metadata = {
  title: "Privacy Policy · DevStash",
  description:
    "How DevStash collects, uses, and protects your data — the information we store, the third-party services we rely on, and your rights."
};

// NOTE: This is an honest, project-accurate starting template — not legal
// advice. Have it reviewed by a qualified professional before relying on it in
// production. Bump LAST_UPDATED by hand only when the policy actually changes.
const LAST_UPDATED = "May 31, 2026";

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {LAST_UPDATED}
      </p>

      <MarketingProse className="mt-6">
        <p>
          This policy explains what information DevStash (&ldquo;DevStash&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, how we use it, and the
          choices you have. It describes how the service actually works today. If
          something here is unclear, reach out using the contact details below.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account information</strong> — your name and email address.
            If you sign up with email and password, we store only a securely
            hashed version of your password, never the password itself.
          </li>
          <li>
            <strong>GitHub profile basics</strong> — if you sign in with GitHub,
            we receive basic profile information (such as your name, email, and
            avatar) from GitHub through the OAuth connection.
          </li>
          <li>
            <strong>Your content</strong> — the items, collections, tags, and
            other knowledge you create and organize in the app.
          </li>
          <li>
            <strong>Uploaded files</strong> — files and images you upload, stored
            in object storage on our behalf.
          </li>
          <li>
            <strong>Billing details</strong> — if you subscribe to Pro, payment
            is handled by our payment processor. We store a customer and
            subscription reference, but we never see or store your full card
            details.
          </li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To operate, maintain, and improve the service.</li>
          <li>To authenticate you and keep your account secure.</li>
          <li>
            To send transactional email such as email verification and password
            reset messages.
          </li>
          <li>To process payments and manage your subscription.</li>
          <li>
            To power optional AI features when you choose to use them (Pro). Only
            the relevant content you act on is sent to the AI provider for that
            request.
          </li>
        </ul>

        <h2>Third-party sub-processors</h2>
        <p>
          We rely on a small set of trusted service providers to run DevStash.
          Each processes data only as needed to provide its part of the service:
        </p>
        <ul>
          <li>
            <strong>Neon</strong> — managed PostgreSQL database hosting.
          </li>
          <li>
            <strong>Cloudflare R2</strong> — object storage for uploaded files
            and images.
          </li>
          <li>
            <strong>Stripe</strong> — payment processing and subscription
            billing.
          </li>
          <li>
            <strong>Resend</strong> — delivery of transactional email.
          </li>
          <li>
            <strong>Upstash</strong> — rate limiting to protect the service from
            abuse.
          </li>
          <li>
            <strong>OpenAI</strong> — powering AI features (Pro only), used only
            when you trigger an AI action.
          </li>
          <li>
            <strong>Our hosting provider</strong> — running the application
            itself.
          </li>
        </ul>

        <h2>Cookies &amp; sessions</h2>
        <p>
          We use a single authentication session cookie, managed by NextAuth
          (stored as a signed JWT), to keep you signed in. We do not use
          third-party advertising or tracking cookies.
        </p>

        <h2>Data retention &amp; deletion</h2>
        <p>
          We keep your data for as long as your account is active. When you
          delete your account, we remove your user record and associated data,
          including the files you uploaded to object storage. Backups and logs
          may persist for a limited period before being overwritten in the normal
          course of operation.
        </p>

        <h2>Your rights</h2>
        <p>
          Depending on where you live, you may have the right to access, correct,
          export, or delete your personal data. You can delete your account at
          any time from your settings, and you can reach us with any other
          request using the contact details below.
        </p>

        <h2>Contact</h2>
        <p>
          A dedicated <code>support@devstash.xyz</code> address is coming soon. In
          the meantime, account deletion is available directly in your settings.
          This page will be updated with a working contact channel once it is
          available.
        </p>
      </MarketingProse>
    </article>
  );
}
