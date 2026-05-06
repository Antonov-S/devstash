import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

export default {
  providers: [GitHub],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth;
      const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) return isLoggedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
