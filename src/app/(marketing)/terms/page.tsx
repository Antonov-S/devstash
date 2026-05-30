import type { Metadata } from "next";

import { MarketingProse } from "@/components/marketing/marketing-prose";

export const metadata: Metadata = {
  title: "Terms of Service · DevStash",
  description:
    "The terms that govern your use of DevStash — accounts, acceptable use, subscriptions, your content, and the usual disclaimers."
};

// NOTE: This is an honest, project-accurate starting template — not legal
// advice. Have it reviewed by a qualified professional before relying on it in
// production. Keep LAST_UPDATED in sync with the Privacy Policy.
const LAST_UPDATED = "May 31, 2026";

export default function TermsPage() {
  return (
    <article>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {LAST_UPDATED}
      </p>

      <MarketingProse className="mt-6">
        <p>
          These terms govern your use of DevStash. By creating an account or
          using the service, you agree to them. If you do not agree, please do
          not use DevStash.
        </p>

        <h2>Acceptance of terms</h2>
        <p>
          By accessing or using DevStash, you confirm that you can form a binding
          agreement and that you accept these terms along with our{" "}
          <a href="/privacy">Privacy Policy</a>.
        </p>

        <h2>Accounts</h2>
        <p>
          You must provide accurate information when you create an account, and
          you are responsible for activity that happens under it. Keep your
          credentials secure and let us know promptly if you believe your account
          has been compromised.
        </p>

        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use DevStash for any unlawful, harmful, or abusive purpose.</li>
          <li>
            Store or share content you do not have the right to store or share.
          </li>
          <li>
            Attempt to disrupt the service, bypass its limits, or access other
            users&rsquo; data.
          </li>
        </ul>

        <h2>Subscriptions &amp; billing</h2>
        <p>
          DevStash Pro is available as a paid subscription at $8 per month or $72
          per year, billed through our payment processor. Your subscription
          renews automatically until you cancel it. You can manage or cancel your
          subscription at any time through the billing portal in your settings.
          Cancellation stops future renewals; we do not offer refunds beyond what
          applicable law requires.
        </p>

        <h2>Free tier limits</h2>
        <p>
          The free tier includes a capped number of items and collections and
          excludes file uploads and AI features. Current limits are shown on our{" "}
          <a href="/#pricing">pricing section</a>. Upgrading to Pro removes these
          limits and unlocks the additional features.
        </p>

        <h2>Your content</h2>
        <p>
          You own the content you create and upload. You grant us the limited
          rights needed to store, process, and display that content back to you
          so we can operate the service. We do not claim ownership of your
          content.
        </p>

        <h2>Termination</h2>
        <p>
          You may stop using DevStash and delete your account at any time. We may
          suspend or terminate access if you violate these terms or use the
          service in a way that risks harm to it or to others. On termination,
          your right to use the service ends, and your data is handled as
          described in our <a href="/privacy">Privacy Policy</a>.
        </p>

        <h2>Disclaimers &amp; limitation of liability</h2>
        <p>
          DevStash is provided &ldquo;as is&rdquo; and &ldquo;as
          available,&rdquo; without warranties of any kind, to the fullest extent
          permitted by law. To the extent permitted by law, we are not liable for
          indirect, incidental, or consequential damages arising from your use of
          the service.
        </p>

        <h2>Changes to these terms</h2>
        <p>
          We may update these terms from time to time. When we do, we will revise
          the &ldquo;Last updated&rdquo; date above. Continued use of DevStash
          after changes take effect means you accept the updated terms.
        </p>

        <h2>Contact</h2>
        <p>
          A dedicated <code>support@devstash.xyz</code> address is coming soon.
          This page will be updated with a working contact channel once it is
          available.
        </p>
      </MarketingProse>
    </article>
  );
}
