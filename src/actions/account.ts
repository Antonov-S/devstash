"use server";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export type DeleteAccountResult = { error: string };

export async function deleteAccountAction(): Promise<DeleteAccountResult | void> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You are not signed in." };
  }

  // Cascading deletes (User → Account, Session, Item, Collection, ItemType) are
  // declared in the Prisma schema via onDelete: Cascade.
  await prisma.user.delete({ where: { id: session.user.id } });

  await signOut({ redirectTo: "/" });
}
