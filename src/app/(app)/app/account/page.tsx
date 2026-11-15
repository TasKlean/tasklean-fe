import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, MailWarning, Pencil, Settings } from "lucide-react";
import { Avatar } from "@/components/common/avatar/avatar";
import { LoadError } from "@/components/common/load-error";
import { MaskedEmail } from "@/components/common/masked-email/masked-email";
import { isApiError } from "@/lib/api/errors";
import { isSessionExpiredError } from "@/lib/api/server/server";
import { parseApiDateOrNull } from "@/lib/time/api-date/api-date";
import { getCurrentUser } from "@/lib/users/me/me";
import type { CurrentUser } from "@/lib/users/me/me.types";
import { fullName } from "@/lib/users/name/name";

export const metadata: Metadata = {
  title: "Account",
};

const PRESS =
  "text-label-lg px-space-lg gap-space-xs flex min-h-11 items-center rounded-full whitespace-nowrap transition-colors";

// Editing is what the card is a way into, so it is the filled one; settings is
// the whole list, which is a wider move than this screen is about.
const PRIMARY_PRESS = `${PRESS} bg-primary text-primary-foreground hover:bg-primary-strong shadow-level-1`;

const QUIET_PRESS = `${PRESS} text-foreground hover:bg-muted border-border/60 border`;

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
        <Avatar
          photoUid={user.photoUid}
          photoUrl={user.photoUrl}
          name={user.name}
          lastName={user.lastName}
          size="lg"
        />

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

        {/* Wraps on a phone, where two pills side by side leave neither room
            to read, and sits in the card's corner once there is width. */}
        <div className="gap-space-sm flex shrink-0 flex-wrap justify-center sm:ml-auto sm:justify-end">
          <Link href="/app/settings/profile" className={PRIMARY_PRESS}>
            <Pencil className="size-4" aria-hidden />
            Edit profile
          </Link>

          <Link href="/app/settings" className={QUIET_PRESS}>
            <Settings className="size-4" aria-hidden />
            Settings
          </Link>
        </div>
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
