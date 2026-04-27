import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../src/generated/prisma/client";

const systemTypes = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
  { name: "link", icon: "Link", color: "#10b981" }
];

async function seedSystemItemTypes(prisma: PrismaClient) {
  for (const type of systemTypes) {
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null, isSystem: true }
    });
    if (existing) {
      console.log(`  · ${type.name} already exists, skipping`);
      continue;
    }
    await prisma.itemType.create({
      data: { ...type, isSystem: true, userId: null }
    });
    console.log(`  ✓ ${type.name}`);
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — copy .env.example to .env first");
  }

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Seeding system item types…");
    await seedSystemItemTypes(prisma);
    console.log("Done.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
