type FactProps = {
  label: string;
  children: string;
};

/** Renders one labelled fact, as a row of the chore's description list. */
export function Fact({ label, children }: Readonly<FactProps>) {
  return (
    <div className="gap-space-xs flex items-baseline justify-between">
      <dt className="text-label-md text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-label-md text-foreground min-w-0 text-right break-words">{children}</dd>
    </div>
  );
}
