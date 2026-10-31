/**
 * A labelled text input, filled rather than outlined. DESIGN.md's prose
 * describes a bordered field; the reviewed screens use a fill, and they win.
 */

import type { InputHTMLAttributes, ReactNode, RefAttributes } from "react";
import { describedById } from "@/components/common/text-field/described-by-id";
import { FieldMessage } from "@/components/common/text-field/field-message";

type TextFieldProps = {
  label: string;
  name: string;
  // Decorative, inside the field on the left.
  icon?: ReactNode;
  // A control inside the field on the right, such as a visibility toggle.
  trailing?: ReactNode;
  // Setting this also marks the field invalid.
  error?: string;
  // Shown under the field until an error replaces it.
  hint?: string;
  // Confirmation under the field, outranked by an error.
  success?: string;
  // Extra content under the field, such as a strength meter.
  below?: ReactNode;
  // Sits opposite the label, for a "Forgot password?" style affordance.
  labelAction?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className"> &
  RefAttributes<HTMLInputElement>;

/** Renders a labelled input with an optional icon, trailing control and error. */
export function TextField({
  label,
  name,
  icon,
  trailing,
  error,
  hint,
  success,
  below,
  labelAction,
  ...input
}: Readonly<TextFieldProps>) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = describedById(errorId, hintId, { error, success, hint });

  return (
    <div className="relative flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <label htmlFor={name} className="text-label-md text-foreground font-semibold">
          {label}
        </label>
        {/* Outside the label and hidden: the input's own `required` is what tells
            a screen reader, so repeating it would read the field twice. */}
        {input.required ? (
          <span aria-hidden className="text-destructive text-label-md">
            *
          </span>
        ) : null}
      </div>

      <div className="relative flex items-center">
        {icon ? (
          <span
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute left-4 flex items-center"
          >
            {icon}
          </span>
        ) : null}

        <input
          {...input}
          id={name}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            "bg-muted text-foreground placeholder:text-muted-foreground text-body-md w-full",
            "rounded-md py-3.5 transition-all duration-200 outline-none",
            "focus:bg-card focus:shadow-level-1",
            "focus-visible:ring-ring/40 focus-visible:ring-2",
            icon ? "pl-12" : "pl-4",
            trailing ? "pr-12" : "pr-4",
            error ? "ring-destructive/60 ring-2" : "",
          ].join(" ")}
        />

        {trailing ? <span className="absolute right-2 flex items-center">{trailing}</span> : null}
      </div>

      {/* After the input in source order, so tab leads into the field rather
          than past it, then placed back on the label row. */}
      {labelAction ? <div className="absolute top-0 right-0">{labelAction}</div> : null}

      <FieldMessage errorId={errorId} hintId={hintId} error={error} success={success} hint={hint} />

      {below}
    </div>
  );
}
