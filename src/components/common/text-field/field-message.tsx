/**
 * The one line below an input. Three possible messages share a slot, so the
 * order here is what decides which one a reader is told about.
 */

type FieldMessageProps = {
  errorId: string;
  hintId: string;
  error?: string;
  success?: string;
  hint?: string;
};

/** Renders the one line below the input: the error, the success or the hint. */
export function FieldMessage({
  errorId,
  hintId,
  error,
  success,
  hint,
}: Readonly<FieldMessageProps>) {
  if (error) {
    return (
      <p id={errorId} className="text-label-md text-destructive">
        {error}
      </p>
    );
  }

  if (success) {
    return (
      <p id={hintId} className="text-label-md text-success-subtle-foreground">
        {success}
      </p>
    );
  }

  if (hint) {
    return (
      <p id={hintId} className="text-label-md text-muted-foreground">
        {hint}
      </p>
    );
  }

  return null;
}
