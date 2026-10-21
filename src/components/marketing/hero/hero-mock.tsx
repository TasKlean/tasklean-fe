/** The sample task list the hero holds up, drawn rather than screenshotted. */

import { MockTask } from "@/components/marketing/hero/mock-task";

/** Renders a static sample of a household's task list. */
export function HeroMock() {
  return (
    <div
      aria-hidden
      className="bg-card shadow-level-3 p-space-md sm:p-space-lg gap-space-md flex flex-col rounded-xl"
    >
      <div className="gap-space-sm flex items-center justify-between">
        <p className="text-label-md text-muted-foreground uppercase">Today · The Flat</p>
        <p className="text-label-sm bg-success-subtle text-success-subtle-foreground px-space-sm py-space-xs rounded-full">
          4 of 5 done
        </p>
      </div>

      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div className="bg-success h-full w-4/5 rounded-full" />
      </div>

      <ul className="gap-space-sm flex flex-col">
        <MockTask title="Dishes & wipe countertops" who="Alex" note="Photo proof" done />
        <MockTask title="Water the plants" who="Mina" note="Every 3 days" done />
        <MockTask title="Take out recycling" who="You" note="Tonight" />
      </ul>
    </div>
  );
}
