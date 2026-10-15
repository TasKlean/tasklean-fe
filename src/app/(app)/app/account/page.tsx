import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, MailWarning, Settings } from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import { LoadError } from "@/components/common/load-error";
import { MaskedEmail } from "@/components/common/masked-email";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server";
import { parseApiDateOrNull } from "@/lib/time/api-date";
import { type CurrentUser, getCurrentUser } from "@/lib/users/me";
import { fullName } from "@/lib/users/name";

export const metadata: Metadata = {
  title: "Account",
};

// Placeholders until there is anything to count. Real metrics need tasks and
// groups, neither of which exists yet.
const METRICS = [
  { label: "Tasks completed", hint: "Once tasks arrive" },
  { label: "Current streak", hint: "Once tasks arrive" },
  { label: "Groups", hint: "Once groups arrive" },
];

/** Renders the month and year an account was opened. */
function memberSince(user: CurrentUser): string | null {
  const created = parseApiDateOrNull(user.dateCreated);
  if (!created) return null;

  // Fixed locale: this renders on the server, where the system one is the
  // container's rather than the reader's.
  return created.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** Renders the account page: who you are, and the way into settings. */
export default async function AccountPage() {
  let user: CurrentUser = {};
  let failure: string | null = null;

  try {
    user = await getCurrentUser();
  } catch (error) {
    // A render cannot clear the cookie, so hand it back to Proxy via /login.
    if (isSessionExpiredError(error)) redirect("/login");
    // Anything the API explained is worth showing here; the route boundary is
    // for the failures nobody saw coming.
    if (!isApiError(error)) throw error;
    failure = error.message;
  }

  const name = fullName(user.name, user.lastName);
  const since = memberSince(user);

  return (
    <div className="max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl md:py-space-2xl gap-space-xl mx-auto flex flex-col">
      {failure ? <LoadError title="We could not load your profile." message={failure} /> : null}

      <section className="bg-card shadow-level-1 p-space-lg sm:p-space-xl gap-space-lg flex flex-col items-center rounded-xl text-center sm:flex-row sm:text-left">
        <Avatar photoUrl={user.photoUrl} name={user.name} lastName={user.lastName} size="lg" />

        <div className="gap-space-xs flex min-w-0 flex-col">
          <h1 className="text-headline-md md:text-headline-lg text-foreground break-words">
            {name ?? "Your account"}
          </h1>

          {user.email ? (
            <MaskedEmail email={user.email} className="self-center sm:self-start" />
          ) : null}

          <div className="gap-space-sm flex flex-wrap items-center justify-center sm:justify-start">
            {user.isEmailVerified ? (
              <span className="text-label-sm bg-muted text-muted-foreground px-space-sm inline-flex items-center gap-1.5 rounded-full py-1">
                <BadgeCheck className="size-4" aria-hidden />
                Email verified
              </span>
            ) : (
              <span className="text-label-sm bg-destructive-subtle text-destructive-subtle-foreground px-space-sm inline-flex items-center gap-1.5 rounded-full py-1">
                <MailWarning className="size-4" aria-hidden />
                Email not verified
              </span>
            )}

            {since ? (
              <span className="text-label-sm text-muted-foreground">Member since {since}</span>
            ) : null}
          </div>
        </div>

        <Link
          href="/app/settings"
          className="text-label-lg text-foreground hover:bg-muted border-border/60 px-space-lg gap-space-xs flex min-h-11 items-center rounded-full border transition-colors sm:ml-auto"
        >
          <Settings className="size-4" aria-hidden />
          Settings
        </Link>
      </section>

      <section className="gap-gutter grid grid-cols-1 sm:grid-cols-3">
        <h2 className="sr-only">Your activity</h2>

        {METRICS.map((metric) => (
          <div
            key={metric.label}
            className="bg-card border-border/60 p-space-lg gap-space-xs flex flex-col rounded-xl border"
          >
            <span className="text-label-md text-muted-foreground">{metric.label}</span>
            <span className="text-headline-md text-muted-foreground/60">Soon</span>
            <span className="text-label-sm text-muted-foreground">{metric.hint}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
