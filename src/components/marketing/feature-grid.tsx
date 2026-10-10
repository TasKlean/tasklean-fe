/**
 * What the app does, one card per capability. Every entry is in the MVP scope.
 * The nudge and the tag half of "Priority, categories and tags" are the two
 * that the API does not serve yet, so this page ships when they do.
 */

import {
  Bell,
  CalendarDays,
  Camera,
  Hash,
  Houses,
  Repeat2,
  Tags,
  Timer,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    icon: Hash,
    title: "One code, everyone in",
    body: "A group has a single invite code. Send it once, they enter it, they are in. Rotate it whenever you like.",
  },
  {
    icon: UserCheck,
    title: "Every task has an owner",
    body: "Assign each one to a person, so who is doing what is a fact on a screen instead of an argument.",
  },
  {
    icon: Repeat2,
    title: "Tasks that come back on their own",
    body: "Set the rhythm once. Bins on Tuesday, sheets every other week, and it reappears when it is due.",
  },
  {
    icon: Bell,
    title: "A nudge, not a nag",
    body: "Ping whoever has the task. One notification lands better than asking a third time over dinner.",
  },
  {
    icon: Camera,
    title: "Photo proof, when it matters",
    body: "Ask for a photo on the jobs someone else will check later. Optional, and set per task.",
  },
  {
    icon: Tags,
    title: "Priority, categories and tags",
    body: "Flag what actually matters, sort the rest into categories, and colour them the way your home thinks.",
  },
  {
    icon: Timer,
    title: "Say how long it takes",
    body: "A time estimate on each task, so whoever has twenty free minutes can find a twenty minute job.",
  },
  {
    icon: Houses,
    title: "More than one group",
    body: "A flat, your parents' house, a shared cabin. Switch between them from one account.",
  },
  {
    icon: CalendarDays,
    title: "List or calendar",
    body: "Work down today's list, or step back and see the whole week laid out by due date.",
  },
];

/** Renders the feature grid. */
export function FeatureGrid() {
  return (
    <section id="features" className="bg-muted/50 py-space-2xl lg:py-space-3xl w-full scroll-mt-20">
      <div className="max-w-app px-margin md:px-margin-tablet lg:px-margin-desktop mx-auto">
        <div className="mb-space-2xl gap-space-xs mx-auto flex max-w-2xl flex-col text-center">
          <p className="text-label-md text-link uppercase">Everything a shared home needs</p>
          <h2 className="text-headline-lg text-primary-strong">
            Built for a home, not a help desk
          </h2>
          <p className="text-body-md text-muted-foreground">
            The parts that matter when several people share one kitchen.
          </p>
        </div>

        <ul className="gap-space-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="bg-card shadow-level-1 p-space-lg gap-space-sm hover:shadow-level-2 flex flex-col rounded-xl transition duration-300 ease-out motion-safe:hover:-translate-y-1"
            >
              <span className="bg-accent text-accent-foreground mb-space-xs flex size-12 items-center justify-center rounded-md">
                <feature.icon className="size-6" aria-hidden />
              </span>
              <h3 className="text-headline-sm text-primary-strong">{feature.title}</h3>
              <p className="text-body-md text-muted-foreground">{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
