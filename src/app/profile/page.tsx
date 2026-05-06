import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserAvatar } from "@/components/user-avatar";

export const metadata = {
  title: "Profile · DevStash"
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/sign-in?callbackUrl=/profile");

  const { name, email, image } = session.user;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6 sm:p-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Account details for your DevStash session.
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
        <UserAvatar
          name={name ?? null}
          email={email}
          image={image ?? null}
          size="lg"
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-base font-medium">
            {name ?? email}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {email}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Profile editing is coming soon.
      </p>
    </div>
  );
}
