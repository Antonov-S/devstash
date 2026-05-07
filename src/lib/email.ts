import "server-only";

import { Resend } from "resend";

const FROM = "DevStash <onboarding@resend.dev>";

let cached: Resend | null = null;

function getResend(): Resend {
  if (cached) return cached;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
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

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: "Verify your DevStash email",
    html,
    text
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message ?? "unknown error"}`);
  }
}
