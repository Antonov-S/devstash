import "server-only";

import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@devstash.io";

export async function getDemoUserId(): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true }
  });
  if (!user) {
    throw new Error(
      `Demo user (${DEMO_EMAIL}) not found — run \`npm run db:seed\``
    );
  }
  return user.id;
}
