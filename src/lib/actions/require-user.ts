import "server-only";

import { auth } from "@/auth";

/**
 * Resolves the signed-in user's id, or an error to early-return. Only resolves
 * identity — write paths that need the Pro flag MUST still call
 * `getUserIsPro(userId)` (a DB read), never `session.user.isPro`, since the JWT
 * can carry a stale value across a Stripe downgrade.
 */
export type RequireUserIdResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function requireUserId(): Promise<RequireUserIdResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You are not signed in." };
  }
  return { ok: true, userId: session.user.id };
}
