import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ChangePasswordDialog } from "@/components/settings/change-password-dialog";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { getUserProfileById } from "@/lib/db/users";

export const metadata = {
  title: "Settings · DevStash"
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/settings");

  const profile = await getUserProfileById(session.user.id);
  if (!profile) redirect("/sign-in?callbackUrl=/settings");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      <section className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="mb-6">
          <h2 className="font-semibold">Account</h2>
          <p className="text-sm text-muted-foreground">
            Update your password and sign-in details
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 rounded-lg border border-border p-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">Password</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {profile.hasPassword
                ? "Change the password for your DevStash account."
                : "You sign in with GitHub. There's no password to manage for this account."}
            </p>
          </div>
          {profile.hasPassword ? <ChangePasswordDialog /> : null}
        </div>
      </section>

      <section className="rounded-xl bg-card p-6 ring-1 ring-destructive/40">
        <div className="mb-6">
          <h2 className="font-semibold text-destructive">Danger zone</h2>
          <p className="text-sm text-muted-foreground">
            Irreversible actions for your account
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Delete account
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Permanently delete your account along with all of your items,
              collections, and tags. This action cannot be undone.
            </p>
          </div>
          <DeleteAccountDialog email={profile.email} />
        </div>
      </section>
    </div>
  );
}
