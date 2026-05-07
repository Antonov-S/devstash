import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_EMAIL = "demo@devstash.io";

function maskedHost(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return "<unparseable DATABASE_URL>";
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — copy .env.example to .env first");
  }

  const confirmed = process.argv.includes("--yes") || process.argv.includes("-y");

  console.log(`Target database: ${maskedHost(connectionString)}`);
  console.log(`Keeping demo user: ${DEMO_EMAIL}`);

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const victims = await prisma.user.findMany({
      where: { email: { not: DEMO_EMAIL } },
      select: { id: true, email: true, name: true }
    });

    if (victims.length === 0) {
      console.log("No non-demo users to delete. Nothing to do.");
      return;
    }

    console.log(`About to delete ${victims.length} user(s):`);
    for (const u of victims) {
      console.log(`  · ${u.email}  (${u.name ?? "no name"})  [${u.id}]`);
    }

    if (!confirmed) {
      console.log(
        "\nDry run — re-run with --yes to actually delete these users and all their content."
      );
      return;
    }

    const orphanIdentifiers = await prisma.verificationToken.findMany({
      where: { identifier: { not: DEMO_EMAIL } },
      select: { identifier: true }
    });

    const userResult = await prisma.user.deleteMany({
      where: { email: { not: DEMO_EMAIL } }
    });
    const tokenResult = await prisma.verificationToken.deleteMany({
      where: { identifier: { not: DEMO_EMAIL } }
    });

    console.log(
      `\nDeleted ${userResult.count} user(s) — items, collections, sessions, accounts, and custom item types cascaded.`
    );
    console.log(
      `Deleted ${tokenResult.count} verification token(s) for ${orphanIdentifiers.length} unique identifier(s).`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Reset failed:");
  console.error(err);
  process.exit(1);
});
