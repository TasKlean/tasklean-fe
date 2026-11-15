/**
 * Tells the other tabs in this browser that the session has ended, from the
 * screen the sign-out landed on rather than from the press that started it.
 *
 * On arrival, because that is the first moment the cookie is certainly gone:
 * posting on the press would race the backend call logout makes first, and the
 * other tabs would reload into a session that was still alive. It also keeps a
 * refused "sign out everywhere" from signing anybody out.
 *
 * Renders nothing.
 */

"use client";

import { useEffect } from "react";
import { broadcastSignedOut } from "@/lib/auth/signed-out-channel/signed-out-channel";

/** Posts the sign-out once, on mount. */
export function SignedOutBroadcast() {
  useEffect(() => {
    broadcastSignedOut();
  }, []);

  return null;
}
