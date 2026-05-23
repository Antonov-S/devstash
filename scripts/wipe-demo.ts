import "dotenv/config";
import Stripe from "stripe";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_EMAIL = "demo@devstash.io";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  const adapter = new PrismaNeon({ connectionString: dbUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
      select: { id: true, stripeSubscriptionId: true, stripeCustomerId: true }
    });
    if (!user) {
      console.log("No demo user found, nothing to wipe.");
      return;
    }
    console.log(`Demo user ${user.id} — sub=${user.stripeSubscriptionId ?? "(none)"}`);

    if (user.stripeSubscriptionId) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        console.warn("STRIPE_SECRET_KEY missing — skipping cancel");
      } else {
        try {
          const stripe = new Stripe(key);
          const cancelled = await stripe.subscriptions.cancel(user.stripeSubscriptionId);
          console.log(`✓ Cancelled Stripe subscription ${cancelled.id} (status=${cancelled.status})`);
        } catch (err) {
          console.warn(`⚠ Stripe cancel failed (proceeding anyway):`, err instanceof Error ? err.message : err);
        }
      }
    }

    const del = await prisma.user.delete({ where: { id: user.id } });
    console.log(`✓ Deleted demo user ${del.email} (cascade handled items/collections/sessions/accounts)`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Wipe failed:");
  console.error(err);
  process.exit(1);
});
