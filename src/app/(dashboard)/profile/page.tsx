import { redirect } from "next/navigation";
import { CalendarDays, Code2, FolderOpen, Mail } from "lucide-react";

import { auth } from "@/auth";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";
import { iconMap } from "@/lib/icons";
import { getCollectionStatsForUser } from "@/lib/db/collections";
import {
  getItemStatsForUser,
  getSystemItemTypesWithCountsForUser
} from "@/lib/db/items";
import { getUserProfileById } from "@/lib/db/users";

export const metadata = {
  title: "Profile · DevStash"
};

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric"
});

function capitalize(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/profile");
  const userId = session.user.id;

  const [profile, itemStats, collectionStats, typeBreakdown] = await Promise.all([
    getUserProfileById(userId),
    getItemStatsForUser(userId),
    getCollectionStatsForUser(userId),
    getSystemItemTypesWithCountsForUser(userId)
  ]);

  if (!profile) redirect("/sign-in?callbackUrl=/profile");

  const displayName = profile.name ?? profile.email;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      <section className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <h2 className="mb-4 font-semibold">Account Information</h2>

        <div className="flex items-center gap-4">
          <UserAvatar
            name={profile.name}
            email={profile.email}
            image={profile.image}
            className="size-16"
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-lg font-semibold">{displayName}</span>
            <span className="text-sm text-muted-foreground">Email account</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-muted-foreground">Email:</span>
            <span className="truncate text-foreground">{profile.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays
              className="w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="text-muted-foreground">Member since:</span>
            <span className="text-foreground">
              {dateFormatter.format(profile.createdAt)}
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        {profile.hasPassword ? (
          <div className="flex flex-row gap-3">
            <ChangePasswordDialog />
            <DeleteAccountDialog email={profile.email} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              You sign in with GitHub. There&apos;s no password to manage for
              this account.
            </p>
            <DeleteAccountDialog email={profile.email} />
          </div>
        )}
      </section>

      <section className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <h2 className="mb-4 font-semibold">Usage Statistics</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
            <Code2 className="size-6 shrink-0 text-cyan-400" aria-hidden />
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none">
                {itemStats.total}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">
                Total Items
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
            <FolderOpen
              className="size-6 shrink-0 text-purple-400"
              aria-hidden
            />
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none">
                {collectionStats.total}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">
                Collections
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 mb-2 text-sm font-medium text-muted-foreground">
          Items by Type
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {typeBreakdown.map((type) => {
            const Icon = iconMap[type.icon];
            return (
              <div
                key={type.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {Icon ? (
                    <Icon
                      className="size-4 shrink-0"
                      style={{ color: type.color }}
                      aria-hidden
                    />
                  ) : null}
                  <span className="truncate text-foreground">
                    {capitalize(type.name)}s
                  </span>
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {type.itemCount}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
