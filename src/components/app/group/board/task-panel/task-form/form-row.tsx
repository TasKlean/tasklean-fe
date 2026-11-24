/**
 * A visible name over a control that carries no label of its own, with the
 * field's error under it.
 *
 * `FilterSelect` and the pill rows are named by `aria-label` rather than by a
 * `<label>`, because neither wraps a single input a label could point at. The
 * text here is the visible half of that same name, so it is `aria-hidden`.
 */

import type { ReactNode } from "react";
import { InfoTip } from "@/components/common/info-tip/info-tip";

type FormRowProps = {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  // What the field is for, which goes in a bubble beside its name.
  info?: string;
  // Hangs that bubble from the row's right-hand end, which a field sharing a
  // row needs: half a row is narrower than the bubble, so anchored to the left
  // it reaches past the panel.
  infoEnd?: boolean;
  children: ReactNode;
};

/** Renders a labelled block around a control that names itself. */
export function FormRow({
  label,
  required,
  error,
  hint,
  info,
  infoEnd,
  children,
}: Readonly<FormRowProps>) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative flex items-center gap-1">
        <span aria-hidden className="text-label-md text-foreground">
          {label}
        </span>
        {required ? (
          <span aria-hidden className="text-destructive text-label-md">
            *
          </span>
        ) : null}
        {info ? (
          <InfoTip label={label} text={info} place={infoEnd ? "above-end" : "above"} />
        ) : null}
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
