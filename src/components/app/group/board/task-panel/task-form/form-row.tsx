/**
 * A visible name over a control that carries no label of its own, with the
 * field's error under it.
 *
 * `FilterSelect` and the pill rows are named by `aria-label` rather than by a
 * `<label>`, because neither wraps a single input a label could point at. The
 * text here is the visible half of that same name, so it is `aria-hidden`.
 */

import type { ReactNode } from "react";

type FormRowProps = {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
};

/** Renders a labelled block around a control that names itself. */
export function FormRow({ label, required, error, hint, children }: Readonly<FormRowProps>) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1" aria-hidden>
        <span className="text-label-md text-foreground">{label}</span>
        {required ? <span className="text-destructive text-label-md">*</span> : null}
      </div>

      {children}

      {error ? (
        <p role="alert" className="text-label-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-label-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
