/**
 * A labelled text input, filled rather than outlined. DESIGN.md's prose
 * describes a bordered field; the reviewed screens use a fill, and they win.
 */

import type { InputHTMLAttributes, ReactNode } from "react";

type TextFieldProps = {
  label: string;
  name: string;
  // Decorative, inside the field on the left.
  icon?: ReactNode;
  // A control inside the field on the right, such as a visibility toggle.
  trailing?: ReactNode;
  // Setting this also marks the field invalid.
  error?: string;
  // Sits opposite the label, for a "Forgot password?" style affordance.
  labelAction?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

/** Renders a labelled input with an optional icon, trailing control and error. */
export function TextField({
  label,
  name,
  icon,
  trailing,
  error,
  labelAction,
  ...input
}: TextFieldProps) {
  const errorId = `${name}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={name} className="text-label-md text-foreground font-semibold">
          {label}
        </label>
        {labelAction}
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
          aria-describedby={error ? errorId : undefined}
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

      {error ? (
        <p id={errorId} className="text-label-md text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
