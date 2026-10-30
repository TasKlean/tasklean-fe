import { redirect } from "next/navigation";

/**
 * Sends a group's settings to their first section.
 *
 * Preferences is everybody's, so it is the one section the redirect can always
 * land on whatever the reader's role is.
 */
export default async function GroupSettingsPage({
  params,
}: PageProps<"/app/groups/[uid]/settings">) {
  const { uid } = await params;

  redirect(`/app/groups/${encodeURIComponent(uid)}/settings/preferences`);
}
