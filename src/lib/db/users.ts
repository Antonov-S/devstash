import "server-only";

import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo@devstash.io";

export type DemoUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export async function getDemoUser(): Promise<DemoUser> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true, name: true, email: true, image: true }
  });
  if (!user) {
    throw new Error(
      `Demo user (${DEMO_EMAIL}) not found — run \`npm run db:seed\``
    );
  }
  return user;
}

export async function getDemoUserId(): Promise<string> {
  const user = await getDemoUser();
  return user.id;
}

export type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  hasPassword: boolean;
};

export async function getUserProfileById(
  userId: string
): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      password: true
    }
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    hasPassword: user.password !== null
  };
}
