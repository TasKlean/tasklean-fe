/**
 * The two-column "before and after". States the problem in the words people use
 * about it, which is the part of the pitch no feature list can carry.
 */

import { Check, X } from "lucide-react";

const BEFORE = [
  "Sticky notes nobody reads, falling off the fridge",
  "Pointed messages in the house group chat",
  "One person quietly keeping track of all of it",
  "A spreadsheet that stopped being updated in March",
];

const AFTER = [
  "Today's tasks, each with a name and a priority on it",
  "Repeating tasks that come back on their own",
  "A record of what was done, without asking",
  "A shared view, so noticing is not one person's job",
];

/** Renders the before-and-after comparison. */
export function Comparison() {
  return (
    <section
      id="why"
      className="max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop py-space-2xl lg:py-space-3xl mx-auto w-full scroll-mt-20"
    >
      <div className="mb-space-2xl gap-space-xs mx-auto flex max-w-2xl flex-col text-center">
        <p className="text-label-md text-link uppercase">A calmer alternative</p>
        <h2 className="text-headline-lg text-primary-strong">
          Why a household needs something other than a to-do app
        </h2>
        <p className="text-body-md text-muted-foreground">
          Running a home is a rhythm, not a project with a deadline.
        </p>
      </div>

      <div className="gap-space-lg grid grid-cols-1 md:grid-cols-2">
        <div className="bg-muted p-space-lg gap-space-md flex flex-col rounded-xl">
          <div className="gap-space-sm flex items-center">
            <span className="bg-destructive-subtle text-destructive-subtle-foreground flex size-8 items-center justify-center rounded-full">
              <X className="size-4" aria-hidden />
            </span>
            <h3 className="text-headline-sm text-primary-strong">How it usually goes</h3>
          </div>
          <ul className="gap-space-sm flex flex-col">
            {BEFORE.map((item) => (
              <li key={item} className="text-body-md text-muted-foreground gap-space-sm flex">
                <X className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card shadow-level-2 p-space-lg gap-space-md flex flex-col rounded-xl">
          <div className="gap-space-sm flex items-center">
            <span className="bg-success-subtle text-success-subtle-foreground flex size-8 items-center justify-center rounded-full">
              <Check className="size-4" aria-hidden />
            </span>
            <h3 className="text-headline-sm text-primary-strong">With TasKlean</h3>
          </div>
          <ul className="gap-space-sm flex flex-col">
            {AFTER.map((item) => (
              <li key={item} className="text-body-md text-foreground gap-space-sm flex">
                <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
