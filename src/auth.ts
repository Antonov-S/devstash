import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";
import { EMAIL_VERIFICATION_ENABLED } from "@/lib/email";

export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  events: {
    async linkAccount({ user, account }) {
      if (account.provider === "github" && user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
    },
  },
  providers: authConfig.providers.map((provider) => {
    if (typeof provider === "function") return provider;
    if (provider.id !== "credentials") return provider;

    return Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        if (!email || !credentials.password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const valid = await compare(credentials.password, user.password);
        if (!valid) return null;

        if (EMAIL_VERIFICATION_ENABLED && !user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    });
  }),
});
