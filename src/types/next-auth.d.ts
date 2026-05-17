import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// JWT lives in @auth/core/jwt; next-auth/jwt only re-exports it, so the
// augmentation must target the source module to merge correctly.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
  }
}
