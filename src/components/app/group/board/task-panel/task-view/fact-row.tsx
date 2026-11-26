import type { ReactNode } from "react";

type FactRowProps = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
};

const ROW = "gap-space-sm px-space-md py-space-sm flex min-h-11 items-center justify-between";

const NAME = "gap-space-xs text-label-md text-muted-foreground flex min-w-0 items-center";

const VALUE = "text-body-md text-foreground gap-space-xs flex min-w-0 flex-wrap justify-end";

/** Renders one labelled fact, as a row of the task's card. */
export function FactRow({ icon, label, children }: Readonly<FactRowProps>) {
  return (
    <div className={ROW}>
      <dt className={NAME}>
        {icon}
        <span className="truncate">{label}</span>
      </dt>

      <dd className={VALUE}>{children}</dd>
    </div>
  );
}
