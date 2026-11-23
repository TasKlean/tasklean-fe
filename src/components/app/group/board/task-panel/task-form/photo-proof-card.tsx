/**
 * Whether finishing the chore means showing it. A card rather than a bare row,
 * because the rule needs a sentence to be understood before it is switched on.
 */

"use client";

import { Camera } from "lucide-react";
import { CARD } from "@/components/app/group/board/task-panel/task-form/task-form.styles";
import { SwitchTrack } from "@/components/common/switch-track/switch-track";

type PhotoProofCardProps = {
  on: boolean;
  onToggle: () => void;
};

/** Renders the photo-proof rule and its switch. */
export function PhotoProofCard({ on, onToggle }: Readonly<PhotoProofCardProps>) {
  return (
    <label
      className={`${CARD} has-[:focus-visible]:ring-ring cursor-pointer has-[:focus-visible]:ring-2`}
    >
      <Camera className="text-muted-foreground size-5 shrink-0" aria-hidden />

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-label-lg text-foreground">Require photo proof on completion</span>

        <span className="text-label-sm text-muted-foreground">
          Whoever does it has to upload a picture showing it is done
        </span>
      </span>

      <input
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
