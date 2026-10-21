type OrDividerProps = {
  label?: string;
};

/** A labelled rule between two ways of doing the same thing. */
export function OrDivider({ label = "or" }: Readonly<OrDividerProps>) {
  return (
    <div role="separator" aria-label={label} className="gap-space-sm flex items-center">
      <span aria-hidden className="bg-border h-px flex-1" />
      <span aria-hidden className="text-label-sm text-muted-foreground uppercase">
        {label}
      </span>
      <span aria-hidden className="bg-border h-px flex-1" />
    </div>
  );
}
