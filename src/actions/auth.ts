"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";

export type AuthActionResult = {
  error?: string;
  code?: "email_not_verified";
  email?: string;
};

export async function credentialsSignInAction(
  _prev: AuthActionResult | undefined,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = formData.get("callbackUrl");

  if (typeof email !== "string" || !email.trim()) {
    return { error: "Email is required" };
  }
  if (typeof password !== "string" || !password) {
    return { error: "Password is required" };
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    await signIn("credentials", {
      email: normalizedEmail,
      password,
      redirectTo:
        typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/dashboard"
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        const code = (error as AuthError & { code?: string }).code;
        if (code === "email_not_verified") {
          return {
            error:
              "Please verify your email before signing in. Check your inbox for the verification link.",
            code: "email_not_verified",
            email: normalizedEmail
          };
        }
        return { error: "Invalid email or password" };
      }
      return { error: "Could not sign in. Please try again." };
    }
    throw error;
  }
}

export async function githubSignInAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl");
  await signIn("github", {
    redirectTo:
      typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/dashboard"
  });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}
