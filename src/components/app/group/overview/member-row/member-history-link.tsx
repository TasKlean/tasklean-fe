/**
 * The way from a membership to its own trail. It is everybody's, not an
 * admin's: the backend narrows a trail per caller, so a member following this
 * sees what they are allowed to see rather than being refused the link.
 */

import Link from "next/link";
import { History } from "lucide-react";
import { QUIET_BUTTON } from "@/components/app/group/overview/member-row/member-row.styles";
import { auditFilterParams } from "@/lib/audit/filter/filter";

type MemberHistoryLinkProps = {
  groupUid: string;
  memberUid: string;
  name: string;
};

/** Renders the link to one membership's history. */
export function MemberHistoryLink({ groupUid, memberUid, name }: Readonly<MemberHistoryLinkProps>) {
  const filter = auditFilterParams({ type: "member", ref: memberUid });
  const href = `/app/groups/${encodeURIComponent(groupUid)}/overview/activity?${filter}`;

  return (
    <Link href={href} aria-label={`History: ${name}`} className={QUIET_BUTTON}>
      <History className="size-4" aria-hidden />
      History
    </Link>
  );
}
