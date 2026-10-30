import type { Metadata } from "next";
import { loadGroup } from "@/app/(app)/app/groups/[uid]/group.helpers";
import { GroupAvatar } from "@/components/app/group-avatar/group-avatar";
import type { Group } from "@/lib/groups/groups.types";
import { createdLabel, groupLabel, memberCountLabel, roleLabel } from "@/lib/groups/labels/labels";

export const metadata: Metadata = {
  title: "Information",
};

const CARD = "bg-card border-border/60 p-space-lg gap-space-lg flex flex-col rounded-xl border";

/** One fact about the group, as a row of its own. */
type Fact = {
  label: string;
  value: string;
};

/**
 * Lists what the group is, in the order it reads.
 *
 * @param group The group the shell already loaded.
 */
function facts(group: Group): Fact[] {
  const rows: Fact[] = [
    { label: "Description", value: group.description?.trim() || "Nothing written yet." },
    { label: "Members", value: memberCountLabel(group.memberCount) ?? "Not counted" },
    { label: "Your role", value: roleLabel(group.myRole) },
  ];

  const created = createdLabel(group.dateCreated);
  if (created) rows.push({ label: "Created", value: created.replace("Created ", "") });

  return rows;
}

/**
 * Renders what this group is: its picture, its name and the rest of its details.
 *
 * The rail carries the name and description too, but this is the screen that
 * holds every field at once, so nothing about the group is only in the chrome.
 */
export default async function GroupInformationPage({
  params,
}: PageProps<"/app/groups/[uid]/overview/information">) {
  const { uid } = await params;
  const { group } = await loadGroup(uid);

  if (!group) return null;

  const name = groupLabel(group.name);

  return (
    <section className="gap-space-md flex flex-col">
      <div className="gap-space-xs flex flex-col">
        <h2 className="text-headline-sm text-foreground">Information</h2>
        <p className="text-body-md text-muted-foreground">
          What this group is. Its admins change these in settings.
        </p>
      </div>

      <div className={CARD}>
        <div className="gap-space-md flex items-center">
          <GroupAvatar name={name} photoUrl={group.photoUrl} size="lg" />
          <h3 className="text-title-lg text-foreground min-w-0 break-words">{name}</h3>
        </div>

        <dl className="gap-space-md flex flex-col">
          {facts(group).map((fact) => (
            <div
              key={fact.label}
              className="gap-space-xs sm:gap-space-md flex flex-col sm:flex-row"
            >
              <dt className="text-label-md text-muted-foreground sm:w-32 sm:shrink-0">
                {fact.label}
              </dt>
              <dd className="text-body-md text-foreground max-w-prose break-words">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
