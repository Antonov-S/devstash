import "dotenv/config";

import bcrypt from "bcryptjs";

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../src/generated/prisma/client";

const DEMO_EMAIL = "demo@devstash.io";
const DEMO_NAME = "Demo User";
const DEMO_PASSWORD = "12345678";

const systemTypes = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
  { name: "link", icon: "Link", color: "#10b981" }
];

type ItemSeed = {
  title: string;
  type: "snippet" | "prompt" | "command" | "note" | "file" | "image" | "link";
  description?: string;
  language?: string;
  content?: string;
  url?: string;
  isPinned?: boolean;
  tags?: string[];
};

type CollectionSeed = {
  name: string;
  description: string;
  isFavorite?: boolean;
  items: ItemSeed[];
};

const collections: CollectionSeed[] = [
  {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    isFavorite: true,
    items: [
      {
        title: "useDebounce hook",
        type: "snippet",
        language: "typescript",
        description: "Debounce a fast-changing value with a configurable delay.",
        isPinned: true,
        tags: ["react", "hooks", "typescript", "performance"],
        content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
`
      },
      {
        title: "Theme context provider",
        type: "snippet",
        language: "typescript",
        description: "Light/dark theme provider with a typed useTheme hook.",
        tags: ["react", "context", "theme", "hooks"],
        content: `import { createContext, useContext, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
type ThemeContextValue = { theme: Theme; toggle: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
`
      },
      {
        title: "cn() className utility",
        type: "snippet",
        language: "typescript",
        description: "Merge Tailwind class names safely with clsx + tailwind-merge.",
        tags: ["tailwind", "utility", "typescript"],
        content: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`
      }
    ]
  },
  {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    items: [
      {
        title: "Code review prompt",
        type: "prompt",
        description: "Structured code review with security, perf, and clarity checks.",
        isPinned: true,
        tags: ["code-review", "security", "ai"],
        content: `Act as a senior engineer reviewing the following code.

Cover, in order:
1. Correctness — logic errors, edge cases, race conditions
2. Security — input validation, auth, secrets handling
3. Performance — unnecessary work, N+1, memory pressure
4. Readability — naming, structure, comments

For each issue: quote the relevant line(s), explain the impact, and suggest a fix.
End with a one-sentence verdict: ship / revise / reject.

Code:
\`\`\`
{{code}}
\`\`\`
`
      },
      {
        title: "Documentation generator",
        type: "prompt",
        description: "Generate README-style docs from a code file.",
        tags: ["docs", "writing", "ai"],
        content: `You are a technical writer. Produce documentation for the file below.

Include:
- One-paragraph overview of what the module does
- Public API: each exported symbol, its signature, and a usage example
- Notable behaviors, edge cases, and gotchas
- Minimal end-to-end example

Tone: concise, code-first, no marketing language.

File:
\`\`\`
{{code}}
\`\`\`
`
      },
      {
        title: "Refactor assistant",
        type: "prompt",
        description: "Propose a refactor while preserving behavior.",
        tags: ["refactor", "code-quality", "ai"],
        content: `Refactor the following code to improve {{goal}} while preserving observable behavior.

Constraints:
- Do not change the public API unless explicitly noted
- Keep existing tests passing
- Prefer small, mechanical steps over rewrites

Output:
1. Summary of the changes and why they help
2. The refactored code in full
3. A short list of risks or follow-ups

Code:
\`\`\`
{{code}}
\`\`\`
`
      }
    ]
  },
  {
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    items: [
      {
        title: "Multi-stage Dockerfile for Next.js",
        type: "snippet",
        language: "dockerfile",
        description: "Production Dockerfile using Next.js standalone output.",
        tags: ["docker", "nextjs", "deployment"],
        content: `# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
`
      },
      {
        title: "Deploy to Fly.io",
        type: "command",
        description: "Build, push, and roll out the app on Fly with health checks.",
        tags: ["fly", "deployment", "ci-cd"],
        content: "fly deploy --remote-only --strategy rolling --wait-timeout 300"
      },
      {
        title: "Docker docs",
        type: "link",
        description: "Official Docker documentation.",
        tags: ["docker", "docs", "reference"],
        url: "https://docs.docker.com/"
      },
      {
        title: "GitHub Actions docs",
        type: "link",
        description: "GitHub Actions workflow syntax and reference.",
        tags: ["github", "ci-cd", "docs"],
        url: "https://docs.github.com/en/actions"
      }
    ]
  },
  {
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    isFavorite: true,
    items: [
      {
        title: "Undo last commit (keep changes staged)",
        type: "command",
        description: "Reverts the last commit but keeps the changes in the index.",
        tags: ["git", "version-control"],
        content: "git reset --soft HEAD~1"
      },
      {
        title: "Stop and remove all containers",
        type: "command",
        description: "Useful to fully reset Docker between dev sessions.",
        tags: ["docker", "cleanup"],
        content: "docker stop $(docker ps -aq) && docker rm $(docker ps -aq)"
      },
      {
        title: "Kill process on port",
        type: "command",
        description: "Find and kill the process holding a TCP port (Linux/macOS).",
        isPinned: true,
        tags: ["debug", "network", "unix"],
        content: "lsof -ti:3000 | xargs kill -9"
      },
      {
        title: "Update all global npm packages",
        type: "command",
        description: "Bumps every globally installed npm package to its latest version.",
        tags: ["npm", "packages"],
        content: "npm update -g"
      }
    ]
  },
  {
    name: "Design Resources",
    description: "UI/UX resources and references",
    items: [
      {
        title: "Tailwind CSS docs",
        type: "link",
        description: "Tailwind CSS official documentation and reference.",
        tags: ["tailwind", "css", "docs"],
        url: "https://tailwindcss.com/docs"
      },
      {
        title: "shadcn/ui",
        type: "link",
        description: "Copy-paste accessible React components built on Radix + Tailwind.",
        isPinned: true,
        tags: ["react", "ui", "components"],
        url: "https://ui.shadcn.com/"
      },
      {
        title: "Radix UI Primitives",
        type: "link",
        description: "Unstyled, accessible UI primitives for React.",
        tags: ["react", "accessibility", "ui"],
        url: "https://www.radix-ui.com/primitives"
      },
      {
        title: "Lucide icons",
        type: "link",
        description: "Beautiful, consistent open-source icon set.",
        tags: ["icons", "ui", "design"],
        url: "https://lucide.dev/"
      }
    ]
  }
];

async function seedSystemItemTypes(prisma: PrismaClient) {
  console.log("Seeding system item types…");
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

async function seedDemoUser(prisma: PrismaClient) {
  console.log(`Seeding demo user (${DEMO_EMAIL})…`);
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log("  · demo user already exists, skipping");
    return existing;
  }
  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      password: await bcrypt.hash(DEMO_PASSWORD, 12),
      isPro: false,
      emailVerified: new Date()
    }
  });
  console.log("  ✓ demo user created");
  return user;
}

async function seedCollectionsAndItems(prisma: PrismaClient, userId: string) {
  console.log("Seeding collections and items…");

  const typeRecords = await prisma.itemType.findMany({
    where: { isSystem: true, userId: null }
  });
  const typeIdByName = new Map(typeRecords.map((t) => [t.name, t.id]));

  // Wipe the demo user's existing items + collections so seed runs land cleanly
  // with the latest data (tags included). Cascade handles TagsOnItems +
  // ItemCollection. Tags themselves are global and shared with other users, so
  // they're left alone — orphaned Tag rows are harmless.
  const { count: deletedItems } = await prisma.item.deleteMany({
    where: { userId }
  });
  const { count: deletedCollections } = await prisma.collection.deleteMany({
    where: { userId }
  });
  if (deletedItems > 0 || deletedCollections > 0) {
    console.log(
      `  ⚠ wiped ${deletedItems} item(s) and ${deletedCollections} collection(s) for ${DEMO_EMAIL}`
    );
  }

  for (const col of collections) {
    const isFavorite = col.isFavorite ?? false;
    const collection = await prisma.collection.create({
      data: {
        userId,
        name: col.name,
        description: col.description,
        isFavorite
      }
    });
    console.log(`  ✓ collection "${col.name}"${isFavorite ? " ★" : ""}`);

    for (const item of col.items) {
      const itemTypeId = typeIdByName.get(item.type);
      if (!itemTypeId) {
        throw new Error(`Missing system item type "${item.type}" — seed types first`);
      }
      const contentType =
        item.type === "link"
          ? ("URL" as const)
          : item.type === "file" || item.type === "image"
            ? ("FILE" as const)
            : ("TEXT" as const);

      const tags = item.tags ?? [];

      await prisma.item.create({
        data: {
          userId,
          itemTypeId,
          title: item.title,
          description: item.description ?? null,
          language: item.language ?? null,
          contentType,
          content: item.url ? null : item.content ?? null,
          url: item.url ?? null,
          isPinned: item.isPinned ?? false,
          collections: {
            create: [{ collectionId: collection.id }]
          },
          tags: {
            create: tags.map((name) => ({
              tag: {
                connectOrCreate: { where: { name }, create: { name } }
              }
            }))
          }
        }
      });

      const tagSuffix = tags.length > 0 ? ` [${tags.join(", ")}]` : "";
      console.log(`    · item "${item.title}"${tagSuffix}`);
    }
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
    await seedSystemItemTypes(prisma);
    const user = await seedDemoUser(prisma);
    await seedCollectionsAndItems(prisma, user.id);
    console.log("Done.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
