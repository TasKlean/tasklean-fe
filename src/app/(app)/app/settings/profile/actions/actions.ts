/**
 * The one Server Action behind the profile form. It reseals the session as well
 * as saving, because the chrome greets by name and draws the avatar from the
 * cookie rather than from a read per page: without that, a save would leave the
 * header showing the old name and the old picture until the next sign-in.
 */

"use server";

import { redirect } from "next/navigation";
import { actionFailureMessage } from "@/lib/api/action-failure/action-failure";
import { getSession, setSession } from "@/lib/auth/session/session";
import { getCurrentUser, updateProfile } from "@/lib/users/me/me";
import type { CurrentUser } from "@/lib/users/me/me.types";
import {
  echoEditProfile,
  parseEditProfile,
  type EditProfileErrors,
  type EditProfileValues,
} from "@/lib/validation/forms/edit-profile.schema/edit-profile.schema";

export type ProfileState = {
  error: string | null;
  saved: boolean;
  fieldErrors?: EditProfileErrors;
  // Echoed so a submit without JS keeps what was typed. The picture is not
  // among them: a hidden uid is nothing a reader could retype.
  values?: EditProfileValues;
};

/**
 * Finds whose profile this is, from the session rather than from the form.
 *
 * Only the subject may send a `photoUid`, so the uid is never taken off the
 * wire: a press can change nobody's account but the reader's own.
 *
 * @returns The uid, or null when even the profile read cannot supply one. The
 * read is the fallback for a session sealed by an exchange that answered with
 * the token pair alone, which carries no uid of its own.
 */
async function subjectUid(sessionUid: string): Promise<string | null> {
  if (sessionUid) return sessionUid;

  const profile = await getCurrentUser().catch(() => null);
  return profile?.uid ?? null;
}

/**
 * Reseals the chrome's copy of the name and the picture from what was saved.
 *
 * Both fields are rebuilt rather than merged, since clearing our upload is what
 * makes the Google picture reappear and a spread would keep the stale one.
 */
async function reseal(uid: string, saved: CurrentUser): Promise<void> {
  const session = await getSession();
  if (!session) return;

  await setSession({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    userUid: session.userUid || uid,
    ...(saved.name ? { name: saved.name } : {}),
    ...(saved.photoUid ? { photoUid: saved.photoUid } : {}),
    ...(saved.photoUrl ? { photoUrl: saved.photoUrl } : {}),
  });
}

/**
 * Saves the reader's own name and picture.
 *
 * @returns The saved state, or the failure to show above the form. A 400 is an
 * upload the backend would not attach as well as a refused name, and both
 * arrive as the line over the form.
 */
export async function updateProfileAction(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const submitted = Object.fromEntries(formData);
  const values = echoEditProfile(submitted);

  const session = await getSession();
  if (!session) redirect("/login");

  const uid = await subjectUid(session.userUid);
  if (!uid) redirect("/login");

  const parsed = parseEditProfile(submitted);
  if (!parsed.ok) return { error: null, saved: false, fieldErrors: parsed.errors, values };

  let saved: CurrentUser;
  try {
    saved = await updateProfile(uid, parsed.values);
  } catch (error) {
    return { error: actionFailureMessage(error), saved: false, values };
  }

  // Writing the cookie re-renders the route, so the page redraws from the save
  // with no revalidation of its own.
  await reseal(uid, saved);
  return { error: null, saved: true };
}
