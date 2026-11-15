/**
 * Sends this tab to the login screen once another one has signed out. The
 * cookie is already gone browser wide, so there is nothing to tear down here:
 * reloading asks Proxy, which redirects to login and keeps the `next` path.
 *
 * Renders nothing.
 */

"use client";

import { useEffect } from "react";
import { onSignedOut } from "@/lib/auth/signed-out-channel/signed-out-channel";

/** Reloads the page when another tab reports a sign-out. */
export function SignedOutListener() {
  useEffect(
    () =>
      onSignedOut(() => {
        // A document request, never `router.refresh()`: a refresh is modelled
        // as a navigation to the route it is already on, so Next discards the
        // redirect Proxy answers with and the tab stays painted as it was.
        window.location.reload();
      }),
    [],
  );

  return null;
}
