/**
 * The members a trail can be pinned to, in the roster's order. It takes the
 * panel over rather than hanging off the row that opened it, because a flyout
 * beside a row has nowhere to go on a phone.
 */

import { ChevronLeft } from "lucide-react";
import { Fragment } from "react";
import type { RefObject } from "react";
import { FormerDivider } from "@/components/app/group/overview/activity/former-divider";
import { choiceHref } from "@/components/app/group/overview/activity/type-menu/type-menu.helpers";
import { FilterMenuRow } from "@/components/common/activity/filter-menu-row";
import { opensFormerBlock } from "@/components/common/activity/filter-menu-row.helpers";
import { DIVIDER, ROW, ROW_OFF } from "@/components/common/activity/filter-menu.styles";
import type { MemberChoice } from "@/lib/audit/audit.types";
import type { AuditFilter } from "@/lib/audit/filter/filter.types";

type MemberListProps = {
  path: string;
  // Carried into every link, so picking a member keeps whatever else the URL
  // asks for. Its `ref` is the membership that is pinned, if any.
  filter: AuditFilter;
  members: readonly MemberChoice[];
  onBack: () => void;
  onClose: () => void;
  back: RefObject<HTMLButtonElement | null>;
};

const ALL_MEMBERS = "All members";

/** Renders one row per member, behind the way back to the kinds. */
export function MemberList({
  path,
  filter,
  members,
  onBack,
  onClose,
  back,
}: Readonly<MemberListProps>) {
  const pinned = filter.ref;

  return (
    <div>
      {/* Named for where it goes rather than where it is, since the chevron
          beside it is hidden and "Members" alone reads as another choice. */}
      <button
        ref={back}
        type="button"
        onClick={onBack}
        aria-label="Back to activity kinds"
        className={`${ROW} ${ROW_OFF}`}
      >
        <ChevronLeft className="size-4 shrink-0" aria-hidden />
        <span className="truncate">Members</span>
      </button>

      <div aria-hidden className={DIVIDER} />

      {/* Capped and scrollable: a household is small, but nothing stops a
          roster being long enough to run off the bottom of the screen. */}
      <ul className="scrollbar-slim max-h-64 overflow-y-auto">
        <FilterMenuRow
          href={choiceHref(path, filter, "member")}
          here={!pinned}
          name={ALL_MEMBERS}
          onPick={onClose}
        />

        {members.map((member, index) => (
          <Fragment key={member.ref}>
            {opensFormerBlock(members, index) ? <FormerDivider /> : null}

            <FilterMenuRow
              href={choiceHref(path, filter, "member", member.ref)}
              here={member.ref === pinned}
              name={member.name}
              former={member.former}
              onPick={onClose}
            />
          </Fragment>
        ))}
      </ul>
    </div>
  );
}
