import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_EMAIL = "demo@devstash.io";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — copy .env.example to .env first");
  }

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Pinging database…");
    const [{ now }] = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;
    console.log(`  ✓ connected — server time: ${now.toISOString()}`);

    console.log("Counting rows per table…");
    const [users, itemTypes, items, collections, tags] = await Promise.all([
      prisma.user.count(),
      prisma.itemType.count(),
      prisma.item.count(),
      prisma.collection.count(),
      prisma.tag.count()
    ]);
    console.log(`  · users:        ${users}`);
    console.log(`  · itemTypes:    ${itemTypes}`);
    console.log(`  · items:        ${items}`);
    console.log(`  · collections:  ${collections}`);
    console.log(`  · tags:         ${tags}`);

    console.log("Listing system item types…");
    const systemTypes = await prisma.itemType.findMany({
      where: { isSystem: true },
      orderBy: { name: "asc" },
      select: { name: true, icon: true, color: true }
    });
    for (const t of systemTypes) {
      console.log(`  · ${t.name.padEnd(8)} ${t.icon.padEnd(11)} ${t.color}`);
    }

    console.log(`Fetching demo user (${DEMO_EMAIL})…`);
    const demoUser = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
      select: {
        id: true,
        name: true,
        email: true,
        isPro: true,
        emailVerified: true,
        password: true,
        createdAt: true
      }
    });

    if (!demoUser) {
      console.log("  ✗ demo user not found — run `npm run db:seed`");
    } else {
      console.log(`  · id:             ${demoUser.id}`);
      console.log(`  · name:           ${demoUser.name}`);
      console.log(`  · email:          ${demoUser.email}`);
      console.log(`  · isPro:          ${demoUser.isPro}`);
      console.log(`  · emailVerified:  ${demoUser.emailVerified?.toISOString() ?? "—"}`);
      console.log(`  · passwordHashed: ${demoUser.password ? "yes" : "no"}`);
      console.log(`  · createdAt:      ${demoUser.createdAt.toISOString()}`);

      console.log("Demo user collections + items…");
      const userCollections = await prisma.collection.findMany({
        where: { userId: demoUser.id },
        orderBy: { name: "asc" },
        include: {
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  title: true,
                  contentType: true,
                  url: true,
                  itemType: { select: { name: true } }
                }
              }
            }
          }
        }
      });

      if (userCollections.length === 0) {
        console.log("  ✗ no collections found — run `npm run db:seed`");
      } else {
        for (const collection of userCollections) {
          console.log(
            `  · ${collection.name} (${collection.items.length} items) — ${
              collection.description ?? "—"
            }`
          );
          for (const link of collection.items) {
            const i = link.item;
            const suffix =
              i.contentType === "URL" && i.url ? `  → ${i.url}` : "";
            console.log(
              `      · [${i.itemType.name.padEnd(7)}] ${i.title}${suffix}`
            );
          }
        }
      }

      const userItemCount = await prisma.item.count({
        where: { userId: demoUser.id }
      });
      console.log(`Demo user total items: ${userItemCount}`);
    }

    console.log("All checks passed.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Database test failed:");
  console.error(err);
  process.exit(1);
});
