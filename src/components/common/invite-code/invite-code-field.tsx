/**
 * A group's invite code with the press that copies it. Shared by the settings
 * section and the bottom bar's panel, so the two cannot drift.
 */

import { CopyButton } from "@/components/common/copy-button/copy-button";

type InviteCodeFieldProps = {
  code: string;
};

// The copy press sits inside the box, so the right side pays its padding to the
// press rather than to the box.
// Painted like every other field in the app, fill and radius both, since what
// it holds is a value somebody takes away rather than a sentence. The copy
// press sits inside it, so the right side pays its padding to the press.
const BOX =
  "bg-muted gap-space-sm pl-space-md flex min-h-13 min-w-0 items-center justify-between rounded-md pr-1";

/** Renders the code and the icon that copies it. */
export function InviteCodeField({ code }: Readonly<InviteCodeFieldProps>) {
  return (
    <div className={BOX}>
      <code className="text-title-md text-foreground truncate tracking-widest">{code}</code>
      <CopyButton value={code} label="Copy invite code" compact />
    </div>
  );
}
