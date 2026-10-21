/**
 * The Google row of the connected accounts card: the widget that links an
 * account, or its state and the way to unlink. A Server Component, so the
 * client id is read here and handed down rather than reaching the browser.
 */

import { BadgeCheck } from "lucide-react";
import { linkGoogleAction } from "@/app/(app)/app/settings/connected-accounts/actions/actions";
import { UnlinkGoogle } from "@/components/app/unlink-google/unlink-google";
import { GoogleButton } from "@/components/auth/google-button/google-button";
import { getEnv } from "@/lib/config/env/env";

type GoogleConnectionProps = {
  linked: boolean;
  // Whether a password exists to fall back on once Google is gone.
  passwordSet: boolean;
  // From Proxy. Without it the widget could only mint a token the backend
  // will reject, so the option stays hidden.
  nonceHash: string | null;
};

/** Renders the Google connection, linked or not. */
export function GoogleConnection({
  linked,
  passwordSet,
  nonceHash,
}: Readonly<GoogleConnectionProps>) {
  if (linked) {
    return (
      <div className="gap-space-sm flex flex-col">
        <span className="text-label-sm bg-muted text-muted-foreground px-space-sm inline-flex w-fit items-center gap-1.5 rounded-full py-1">
          <BadgeCheck className="size-4" aria-hidden />
          Connected
        </span>

        <UnlinkGoogle canUnlink={passwordSet} />
      </div>
    );
  }

  if (!nonceHash) {
    return (
      <p className="text-label-sm text-muted-foreground">
        Linking is unavailable right now. Reload the page and try again.
      </p>
    );
  }

  return (
    <div className="max-w-sm">
      <GoogleButton
        action={linkGoogleAction}
        clientId={getEnv().NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        intent="link"
        nonceHash={nonceHash}
      />
    </div>
  );
}
