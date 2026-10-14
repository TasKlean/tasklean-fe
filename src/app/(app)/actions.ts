/**
 * The Server Actions behind the signed-in shell. Logout is here rather than
 * with a route because the header owns it, and the header spans every page.
 */

"use server";

import { redirect } from "next/navigation";
import { deviceHeaders } from "@/lib/auth/device";
import { clearSession, getSession } from "@/lib/auth/session";
import { revokeSession } from "@/lib/auth/tokens/logout";

/** Ends the session and returns the visitor to the public site. */
export async function logoutAction(): Promise<void> {
  const session = await getSession();

  if (session) {
    // Best effort: a refused revoke must not strand someone in a session they
    // already asked to leave, and the cookie below is what the browser obeys.
    await revokeSession(session.refreshToken, await deviceHeaders()).catch(() => {});
  }

  await clearSession();
  redirect("/");
}
