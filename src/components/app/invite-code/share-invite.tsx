/**
 * Where sharing the code to somewhere else will live. Disabled until there is
 * something behind it, with the reason in its name: the row it sits in has no
 * width for a sentence.
 */

import { Share2 } from "lucide-react";
import { CODE_ACTION } from "@/components/app/invite-code/invite-code.styles";

/** Renders the share press, which does nothing yet. */
export function ShareInvite() {
  return (
    <button
      type="button"
      disabled
      aria-label="Share the code, coming soon"
      title="Sharing is coming soon"
      className={CODE_ACTION}
    >
      <Share2 className="size-5" aria-hidden />
    </button>
  );
}
