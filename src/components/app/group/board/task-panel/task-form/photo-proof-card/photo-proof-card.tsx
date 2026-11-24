/**
 * Whether finishing the chore means showing it. A card rather than a bare row,
 * the rule being one a reader has to understand before switching it on, with
 * what it does behind the (i) rather than in a line under the switch.
 */

"use client";

import { Camera } from "lucide-react";
import { FIELD_INFO } from "@/components/app/group/board/task-panel/task-form/task-form.labels";
import { CARD } from "@/components/app/group/board/task-panel/task-form/task-form.styles";
import { InfoTip } from "@/components/common/info-tip/info-tip";
import { SwitchTrack } from "@/components/common/switch-track/switch-track";

type PhotoProofCardProps = {
  on: boolean;
  onToggle: () => void;
};

// Named rather than left to tree order: a label's control is its first
// labelable descendant, and the (i) is a button, which is one. Unnamed, the
// card hovered and pressed that press instead of its own switch.
const SWITCH_ID = "requiresPhotoProof";

// The ring is the switch's own: the (i) beside it is focusable too, and a
// press on that should not light up the whole card.
const RING = "has-[input:focus-visible]:ring-ring has-[input:focus-visible]:ring-2";

/** Renders the photo-proof rule and its switch. */
export function PhotoProofCard({ on, onToggle }: Readonly<PhotoProofCardProps>) {
  return (
    <label htmlFor={SWITCH_ID} className={`${CARD} ${RING} cursor-pointer`}>
      <Camera className="text-muted-foreground size-5 shrink-0" aria-hidden />

      {/* The (i) follows the words, and the bubble hangs off this row rather
          than off the card, so it comes up over the text it explains. */}
      <span className="relative flex min-w-0 flex-1 items-center gap-1">
        <span className="text-label-lg text-foreground">Require photo proof on completion</span>

        <InfoTip label="Require photo proof" text={FIELD_INFO.photoProof} />
      </span>

      <input
        id={SWITCH_ID}
        type="checkbox"
        role="switch"
        name="requiresPhotoProof"
        checked={on}
        onChange={onToggle}
        className="sr-only"
      />

      <SwitchTrack on={on} />
    </label>
  );
}
