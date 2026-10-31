/**
 * The Google row of the connected accounts card: the widget that links an
 * account, or the way to unlink one. A Server Component, so the client id is
 * read here and handed down rather than reaching the browser. The linked badge
 * is the page's, since it belongs on the heading row.
 */

import { linkGoogleAction } from "@/app/(app)/app/settings/connected-accounts/actions/actions";
import { UnlinkGoogle } from "@/components/app/settings/connected-accounts/unlink-google/unlink-google";
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
  if (linked) return <UnlinkGoogle canUnlink={passwordSet} />;

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
