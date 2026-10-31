import { redirect } from "next/navigation";

/**
 * Sends the overview to its first section.
 *
 * The area is a rail of sections rather than a screen of its own, so the entry
 * pointing at it has somewhere to land.
 */
export default async function GroupOverviewPage({
  params,
}: PageProps<"/app/groups/[uid]/overview">) {
  const { uid } = await params;

  redirect(`/app/groups/${encodeURIComponent(uid)}/overview/information`);
}
