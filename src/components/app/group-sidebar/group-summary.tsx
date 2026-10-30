/**
 * The group a reader is inside, at the top of its rail: the name, what it is
 * for, and where the reader stands in it. The heading stays in the tree when
 * the rail collapses, so the page never loses the only `h1` it has.
 */

import { Users } from "lucide-react";
import { GroupDescription } from "@/components/app/group-sidebar/group-description";

type GroupSummaryProps = {
  name: string;
  description: string | null;
  members: string | null;
  admin: boolean;
  collapsed: boolean;
};

// A card in the rail, and a plain page header on a phone, where a box around
// the page's own title reads as a box inside a box.
const CARD =
  "gap-space-xs lg:bg-card lg:border-border/60 lg:p-space-md flex flex-col lg:rounded-xl lg:border";

/** Renders a group's identity card. */
export function GroupSummary({
  name,
  description,
  members,
  admin,
  collapsed,
}: Readonly<GroupSummaryProps>) {
  const away = collapsed ? "lg:hidden" : "";

  return (
    <section className={`${CARD} ${collapsed ? "lg:items-center" : ""}`}>
      <span
        aria-hidden
        className={`bg-muted text-foreground text-label-lg hidden size-9 shrink-0 items-center justify-center rounded-lg ${collapsed ? "lg:flex" : ""}`}
      >
        {name.charAt(0).toUpperCase()}
      </span>

      <h1
        className={`text-headline-md lg:text-title-md text-foreground break-words ${collapsed ? "lg:sr-only" : ""}`}
      >
        {name}
      </h1>

      {description ? <GroupDescription description={description} away={away} /> : null}

      <p
        className={`text-label-md text-muted-foreground gap-space-xs flex flex-wrap items-center ${away}`}
      >
        <Users className="size-4 shrink-0" aria-hidden />
        {members ? (
          <>
            {members}
            <span aria-hidden>·</span>
          </>
        ) : null}
        {admin ? "You are an admin" : "You are a member"}
      </p>
    </section>
  );
}
