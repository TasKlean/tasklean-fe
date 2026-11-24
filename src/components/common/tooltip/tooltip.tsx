/**
 * A hover bubble naming what the thing under it is, for a pill or a mark whose
 * own text carries the value but not the kind.
 *
 * The bubble is `aria-hidden`, or it would land in the accessible name of
 * whatever wraps it, which on the board is the row's own link. Anything a
 * reader has to hear belongs in the child's own `sr-only` text.
 */

import type { ReactNode } from "react";
import {
  TIP_PLACE,
  TIP_QUIET,
  TIP_WIDTH,
  type TipPlace,
  type TipWidth,
} from "@/components/common/tooltip/tooltip.styles";

type TooltipProps = {
  text: string;
  place?: TipPlace;
  // How the child takes its width: `fit` for a pill, `shrink` for one that
  // truncates, `fill` for a control that spans its row.
  width?: TipWidth;
  children: ReactNode;
};

/** Renders a child with the bubble that names it on hover. */
export function Tooltip({
  text,
  place = "above",
  width = "fit",
  children,
}: Readonly<TooltipProps>) {
  return (
    <span className={TIP_WIDTH[width]}>
      {children}

      <span aria-hidden className={`${TIP_QUIET} ${TIP_PLACE[place]}`}>
        {text}
      </span>
    </span>
  );
}
