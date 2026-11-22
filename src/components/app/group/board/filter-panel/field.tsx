/**
 * One axis of the board's filter, under its own name. A real `<fieldset>`, so
 * the browser groups and names the choices inside it.
 */

import type { ReactNode } from "react";
import { LEGEND } from "@/components/app/group/board/filter-panel/filter-panel.styles";

type FieldProps = {
  legend: string;
  children: ReactNode;
  // Scrolls sideways instead of wrapping, for an axis with many choices.
  strip?: boolean;
};

const WRAP = "gap-space-xs flex flex-wrap";

// A strip rather than a wrap: a household with twenty categories would
// otherwise stack five rows deep and push Apply off a phone.
const STRIP = "gap-space-xs scrollbar-slim -mx-1 flex overflow-x-auto px-1 pb-1";

/** Renders one axis and the choices it offers. */
export function Field({ legend, children, strip = false }: Readonly<FieldProps>) {
  return (
    // `min-w-0` is load-bearing: a fieldset defaults to `min-width: min-content`
    // and would grow past the panel rather than let a strip scroll. Measured.
    <fieldset className="min-w-0">
      <legend className={LEGEND}>{legend}</legend>
      <div className={strip ? STRIP : WRAP}>{children}</div>
    </fieldset>
  );
}
