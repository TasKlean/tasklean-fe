import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/auth/back-link";
import { ProfileForm } from "@/components/app/settings/profile/profile-form/profile-form";
import { LoadError } from "@/components/common/load-error";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { getCurrentUser } from "@/lib/users/me/me";
import type { CurrentUser } from "@/lib/users/me/me.types";

export const metadata: Metadata = {
  title: "Profile",
};

/** Renders the profile section: your name and your picture. */
export default async function ProfilePage() {
  let user: CurrentUser | null = null;
  let failure: string | null = null;

  try {
    user = await getCurrentUser();
  } catch (error) {
    // A render cannot clear the cookie, so hand it back to Proxy via /login.
    if (isSessionExpiredError(error)) redirect("/login");

    if (!isApiError(error)) throw error;
    failure = error.message;
  }

  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <div className="flex items-center lg:hidden">
          <BackLink href="/app/settings" label="Back to settings" />
        </div>

        <h2 className="text-headline-sm text-foreground">Profile</h2>
        <p className="text-body-md text-muted-foreground">
          Your name and picture, as everyone in your groups sees them. Your email address is not a
          profile field: it is how you sign in.
        </p>
      </div>

      {/* The uid is what an upload is signed for, so without it there is no
          picture to pick and the form stays away. */}
      {failure || !user?.uid ? (
        <LoadError
          title="We could not load your profile."
          message={failure ?? "Please try again."}
        />
      ) : (
        <div className="bg-card border-border/60 p-space-lg rounded-xl border">
          <ProfileForm
            userUid={user.uid}
            name={user.name ?? ""}
            middleName={user.middleName ?? ""}
            lastName={user.lastName ?? ""}
            photoUid={user.photoUid ?? null}
          />
        </div>
      )}
    </section>
  );
}
