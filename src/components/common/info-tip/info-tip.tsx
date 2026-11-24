/**
 * An (i) beside a field's name, holding the sentence saying what the field is
 * for. The words sit here rather than under the control, where they pushed
 * every field apart and read as a notice.
 *
 * A press as well as a hover, because a touch screen has no hover and Safari
 * does not focus a button it was tapped on.
 */

"use client";

import { Info } from "lucide-react";
import { useId } from "react";
import { TIP_PEER, TIP_PLACE, TIP_SHOWN } from "@/components/common/tooltip/tooltip.styles";
import { useDisclosure } from "@/hooks/use-disclosure/use-disclosure";

type InfoPlace = "above" | "above-end" | "right";

type InfoTipProps = {
  // The field or section this explains, which is what names the press.
  label: string;
  text: string;
  // Above by default, `above-end` for a field sharing a row, whose own row is
  // narrower than the bubble, and `right` for a heading.
  place?: InfoPlace;
};

// Where each bubble hangs, and off what: a field's own row caps it at that
// field's width, where a heading's row is the width of the page.
const WHERE = { above: "above-start", "above-end": "above-end", right: "right" } as const;

const ANCHOR = {
  above: "inline-flex",
  "above-end": "inline-flex",
  right: "static sm:relative inline-flex",
} as const;

// 24px drawn, so a label's row keeps its height, with the hit area taken out
// to 44 by a pseudo-element rather than by padding that would move the text.
const PRESS =
  "peer text-muted-foreground hover:text-foreground focus-visible:ring-ring relative flex size-6 shrink-0 items-center justify-center rounded-full transition-colors before:absolute before:-inset-2.5 before:content-[''] focus-visible:ring-2 focus-visible:outline-none";

/** Renders the press that explains one field, and the bubble it opens. */
export function InfoTip({ label, text, place = "above" }: Readonly<InfoTipProps>) {
  const { open, toggle, root, trigger } = useDisclosure();
  const id = useId();

  return (
    <div ref={root} className={ANCHOR[place]}>
      <button
        ref={trigger}
        type="button"
        // Kept to itself, so an (i) inside a `<label>` does not also toggle
        // the control that label is for.
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggle();
        }}
        aria-expanded={open}
        aria-label={`About ${label}`}
        aria-describedby={id}
        className={PRESS}
      >
        <Info className="size-4" aria-hidden />
      </button>

      <span
        id={id}
        role="tooltip"
        className={`${open ? TIP_SHOWN : TIP_PEER} ${TIP_PLACE[WHERE[place]]}`}
      >
        {text}
      </span>
    </div>
  );
}
