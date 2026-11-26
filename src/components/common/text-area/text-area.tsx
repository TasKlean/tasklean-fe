/**
 * A labelled multi-line field, painted like `TextField` so the two read as one
 * control. It borrows that component's message and `aria-describedby` helpers
 * rather than growing a second copy of the same wiring.
 *
 * A `maxLength` is shown as a count beside the hint, since a field that stops
 * accepting characters without saying why reads as a broken keyboard.
 *
 * It grows with what is typed, and `field-sizing` makes `rows` stop applying,
 * so `min-h` is what keeps an empty field from collapsing to a single line. A
 * browser without the property falls back to `rows` and the old scrollbar.
 *
 * `fixed` turns that off for a field that loads with something already in it,
 * where growing to fit means the box is a different size every time it opens.
 * It is still dragged taller by hand.
 */

import type { TextareaHTMLAttributes } from "react";
import { InfoTip } from "@/components/common/info-tip/info-tip";
import { describedById } from "@/components/common/text-field/described-by-id";
import { FieldMessage } from "@/components/common/text-field/field-message";

type TextAreaProps = {
  label: string;
  name: string;
  // Setting this also marks the field invalid.
  error?: string;
  // Shown under the field until an error replaces it.
  hint?: string;
  // What the field is for, which goes in a bubble beside its name.
  info?: string;
  // A set height rather than one that follows the content, for a field whose
  // value arrives with it. The reader may still drag it taller.
  fixed?: boolean;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

/** Renders a labelled textarea with its own error and hint line. */
export function TextArea({
  label,
  name,
  error,
  hint,
  info,
  fixed = false,
  ...textarea
}: Readonly<TextAreaProps>) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = describedById(errorId, hintId, { error, hint });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative flex items-center gap-1">
        <label htmlFor={name} className="text-label-md text-foreground font-semibold">
          {label}
        </label>
        {textarea.required ? (
          <span aria-hidden className="text-destructive text-label-md">
            *
          </span>
        ) : null}
        {info ? <InfoTip label={label} text={info} /> : null}
      </div>

      <textarea
        {...textarea}
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          "bg-muted text-foreground placeholder:text-muted-foreground text-body-md w-full",
          fixed ? "h-28" : "field-sizing-content min-h-24",
          "resize-y rounded-md px-4 py-3.5 transition-all duration-200 outline-none",
          "focus:bg-card focus:shadow-level-1",
          "focus-visible:ring-ring/40 focus-visible:ring-2",
          error ? "ring-destructive/60 ring-2" : "",
        ].join(" ")}
      />

      <div className="gap-space-sm flex items-start justify-between">
        <FieldMessage errorId={errorId} hintId={hintId} error={error} hint={hint} />

        {textarea.maxLength ? (
          // Out of the accessible name on purpose: the field's own maxLength is
          // what a screen reader announces, and a live count would chatter.
          <span aria-hidden className="text-label-sm text-muted-foreground shrink-0">
            {String(textarea.value ?? "").length} / {textarea.maxLength}
          </span>
        ) : null}
      </div>
    </div>
  );
}
