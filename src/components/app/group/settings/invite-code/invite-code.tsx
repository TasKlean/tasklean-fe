/**
 * The invite code, with the three things an admin does to it. It lives here
 * rather than on the overview, because only an admin is sent one at all and the
 * overview is a screen every member sees.
 */

import { InviteCodeField } from "@/components/common/invite-code/invite-code-field";
import { ShareInvite } from "@/components/common/invite-code/share-invite";
import { RotateInviteCode } from "@/components/app/group/settings/rotate-invite-code/rotate-invite-code";

type InviteCodeProps = {
  groupUid: string;
  code: string;
};

/** Renders the code, the way to copy it, the way to replace it and the way to pass it on. */
export function InviteCode({ groupUid, code }: Readonly<InviteCodeProps>) {
  return (
    // Wrapping, because the confirmation the replacement opens takes the whole
    // width and the field keeps its own line underneath it.
    <div className="gap-space-sm flex max-w-2xl flex-wrap items-center">
      <InviteCodeField code={code} />
      <RotateInviteCode groupUid={groupUid} />
      <ShareInvite />
    </div>
  );
}
