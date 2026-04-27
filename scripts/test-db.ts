import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../src/generated/prisma/client";

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
