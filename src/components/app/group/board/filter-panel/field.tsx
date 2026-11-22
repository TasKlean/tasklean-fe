/**
 * One axis of the board's filter, under its own name, which is the press that
 * shows and hides it. A real `<fieldset>`, so the browser groups and names the
 * choices inside it, and the legend is the whole press.
 *
 * **Closed means hidden, never unmounted.** A form posts a field it cannot
 * see, so a collapsed axis keeps the choice already on it; unmounting would
 * clear the filter the moment a reader tidied the panel.
 */

"use client";

import { Minus, Plus } from "lucide-react";
import { type ReactNode, useId } from "react";

type FieldProps = {
  legend: string;
  // How the choices sit: wrapped pills, a sideways strip for an axis there
  // could be twenty of, or a block for a control a flex row would collapse.
  layout?: "wrap" | "strip" | "block";
  // Held by the panel, not here: one press in the Filter heading opens and
  // closes every field at once.
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

// The weight is in the token, so `font-semibold` beside it would be a second
// rule for one property.
const LEGEND = "text-label-lg text-muted-foreground w-full";

const TOGGLE =
  "gap-space-sm hover:text-foreground focus-visible:ring-ring flex min-h-9 w-full items-center justify-between rounded-lg text-left transition-colors focus-visible:ring-2 focus-visible:outline-none";

const BODY = {
  wrap: "gap-space-xs flex flex-wrap",
  // A strip rather than a wrap: a household with twenty categories would
  // otherwise stack five rows deep and push Apply off a phone.
  strip: "gap-space-xs scrollbar-slim -mx-1 flex overflow-x-auto px-1 pb-1",
  block: "block",
} as const;

/** Renders one axis, and the press that shows or hides the choices on it. */
export function Field({ legend, layout = "wrap", open, onToggle, children }: Readonly<FieldProps>) {
  const bodyId = useId();

  const Icon = open ? Minus : Plus;

  return (
    // `min-w-0` is load-bearing: a fieldset defaults to `min-width: min-content`
    // and would grow past the panel rather than let a strip scroll. Measured.
    <fieldset className="min-w-0">
      {/* The gap under the name belongs to an open field only, or six closed
          ones each leave dead space below their press. */}
      <legend className={`${LEGEND} ${open ? "mb-1.5" : ""}`}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
          className={TOGGLE}
        >
          {legend}
          <Icon className="size-4 shrink-0" aria-hidden />
        </button>
      </legend>

      <div id={bodyId} className={open ? BODY[layout] : "hidden"}>
        {children}
      </div>
    </fieldset>
  );
}
