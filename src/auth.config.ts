import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

export default {
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: () => null,
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth;
      const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) return isLoggedIn;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      // Refresh isPro from the DB on every JWT validation so a Stripe webhook
      // upgrade/downgrade reflects on the user's next request without forcing
      // a sign-out. The dynamic import keeps Prisma out of the edge bundle —
      // auth.config.ts is consumed by middleware, which runs on the edge.
      if (token.id) {
        const { prisma } = await import("@/lib/prisma");
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { isPro: true }
        });
        token.isPro = dbUser?.isPro ?? false;
      }

      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
      }
      session.user.isPro = token.isPro ?? false;
      return session;
    },
  },
} satisfies NextAuthConfig;
